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
import smart_campus_backend.booking.repository.BookingRepository;
import smart_campus_backend.exception.BookingConflictException;
import smart_campus_backend.resource.entity.CampusResource;
import smart_campus_backend.resource.repository.CampusResourceRepository;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CampusResourceRepository resourceRepository;

    @Transactional
    public BookingResponse createBooking(BookingRequest request, User user) {
        // 1. Validate resource exists
        CampusResource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new EntityNotFoundException("Resource not found with ID: " + request.getResourceId()));

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
            throw new BookingConflictException("The resource is already booked for the selected time slot");
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

        return mapToResponse(bookingRepository.save(booking));
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

        booking.setStatus(BookingStatus.APPROVED);
        return mapToResponse(bookingRepository.save(booking));
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
        return mapToResponse(bookingRepository.save(booking));
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
        return mapToResponse(bookingRepository.save(booking));
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
