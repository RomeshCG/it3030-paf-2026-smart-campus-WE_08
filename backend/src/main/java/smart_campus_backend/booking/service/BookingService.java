package smart_campus_backend.booking.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smart_campus_backend.auth.entity.User;
import smart_campus_backend.booking.dto.BookingRequest;
import smart_campus_backend.booking.dto.BookingResponse;
import smart_campus_backend.booking.entity.Booking;
import smart_campus_backend.booking.entity.BookingStatus;
import smart_campus_backend.booking.entity.BookingAudit;
import smart_campus_backend.booking.repository.BookingAuditRepository;
import smart_campus_backend.booking.repository.BookingRepository;
import smart_campus_backend.exception.BookingConflictException;
import smart_campus_backend.notification.service.NotificationService;
import smart_campus_backend.resource.entity.CampusResource;
import smart_campus_backend.resource.entity.ResourceStatus;
import smart_campus_backend.resource.repository.CampusResourceRepository;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CampusResourceRepository resourceRepository;
    private final BookingAuditRepository auditRepository;
    private final NotificationService notificationService;

    @Transactional
    public BookingResponse createBooking(BookingRequest request, User user) {
        // 1. Validate resource exists
        CampusResource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new EntityNotFoundException("Resource not found with ID: " + request.getResourceId()));

        if (resource.getStatus() != ResourceStatus.ACTIVE || !Boolean.TRUE.equals(resource.getAvailable())) {
            throw new IllegalStateException("This resource is currently unavailable for booking");
        }

        if (request.getAttendees() != null && request.getAttendees() > resource.getCapacity()) {
            throw new IllegalArgumentException("Attendees cannot exceed resource capacity of " + resource.getCapacity());
        }

        // 2. Validate startTime < endTime
        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        // 3. Conflict Detection
        // Check only against PENDING and APPROVED bookings
        List<BookingStatus> activeStatuses = Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED);
        boolean hasConflict = bookingRepository.existsOverlappingBooking(
                request.getResourceId(),
                request.getDate(),
                request.getStartTime(),
                request.getEndTime(),
                activeStatuses
        );

        if (hasConflict) {
            List<String> suggestions = suggestAvailableSlots(request.getResourceId(), request.getDate(), request.getEndTime());
            String message = "The resource is already booked for the selected time slot. ";
            if (!suggestions.isEmpty()) {
                message += "Recommended slots: " + String.join(", ", suggestions);
            }
            throw new BookingConflictException(message);
        }

        // 4. Create and Save
        Booking booking = Booking.builder()
                .user(user)
                .resource(resource)
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .attendees(request.getAttendees())
                .status(BookingStatus.PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);
        createAuditLog(saved, "CREATED", user.getName());
        return mapToResponse(saved);
    }

    private List<String> suggestAvailableSlots(Long resourceId, java.time.LocalDate date, LocalTime startTime) {
        List<String> suggestions = new ArrayList<>();
        LocalTime current = startTime;
        List<BookingStatus> activeStatuses = Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED);

        while (suggestions.size() < 3 && current.isBefore(LocalTime.of(22, 0))) {
            LocalTime potentialEnd = current.plusHours(1);
            boolean hasConflict = bookingRepository.existsOverlappingBooking(resourceId, date, current, potentialEnd, activeStatuses);
            if (!hasConflict) {
                suggestions.add(current + " - " + potentialEnd);
            }
            current = current.plusHours(1);
        }
        return suggestions;
    }

    private void createAuditLog(Booking booking, String action, String performedBy) {
        BookingAudit audit = BookingAudit.builder()
                .booking(booking)
                .status(booking.getStatus())
                .action(action)
                .performedBy(performedBy)
                .timestamp(LocalDateTime.now())
                .build();
        auditRepository.save(audit);
    }

    public List<BookingResponse> getMyBookings(User user) {
        return bookingRepository.findByUserOrderByDateDescStartTimeDesc(user)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllByOrderByDateDescStartTimeDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));

        if (booking.getStatus() == BookingStatus.APPROVED) {
            throw new IllegalStateException("Booking is already approved");
        }
        
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be approved");
        }

        CampusResource resource = booking.getResource();
        if (resource.getStatus() != ResourceStatus.ACTIVE || !Boolean.TRUE.equals(resource.getAvailable())) {
            throw new IllegalStateException("Cannot approve booking: resource is currently unavailable");
        }
        if (booking.getAttendees() != null && booking.getAttendees() > resource.getCapacity()) {
            throw new IllegalStateException("Cannot approve booking: attendees exceed resource capacity");
        }

        boolean hasApprovedConflict = bookingRepository.existsOverlappingBookingExcluding(
                resource.getId(),
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getId(),
                List.of(BookingStatus.APPROVED)
        );
        if (hasApprovedConflict) {
            throw new BookingConflictException("Cannot approve booking: the selected time slot is already allocated");
        }

        booking.setStatus(BookingStatus.APPROVED);
        Booking saved = bookingRepository.save(booking);
        createAuditLog(saved, "APPROVED", "ADMIN");
        notificationService.createNotification(booking.getUser(), "Your booking for " + booking.getResource().getName() + " on " + booking.getDate() + " has been APPROVED.");
        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse rejectBooking(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        Booking saved = bookingRepository.save(booking);
        createAuditLog(saved, "REJECTED", "ADMIN");
        notificationService.createNotification(booking.getUser(), "Your booking for " + booking.getResource().getName() + " on " + booking.getDate() + " has been REJECTED. Reason: " + reason);
        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse cancelBooking(Long id, User user) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));

        // Use check: user can only cancel their own bookings
        if (!booking.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("You can only cancel your own bookings");
        }

        if (booking.getStatus() == BookingStatus.REJECTED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Booking is already in a terminal state");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);
        createAuditLog(saved, "CANCELLED", user.getName());
        return mapToResponse(saved);
    }

    public List<BookingAudit> getBookingHistory(Long id) {
        return auditRepository.findByBookingIdOrderByTimestampDesc(id);
    }

    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .userName(booking.getUser().getName())
                .resourceId(booking.getResource().getId())
                .resourceName(booking.getResource().getName())
                .resourceLocation(booking.getResource().getLocation())
                .date(booking.getDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .attendees(booking.getAttendees())
                .status(booking.getStatus())
                .rejectionReason(booking.getRejectionReason())
                .build();
    }
}
