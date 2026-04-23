package smart_campus_backend.booking.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smart_campus_backend.auth.entity.User;
import smart_campus_backend.booking.dto.ApproveBookingRequest;
import smart_campus_backend.booking.dto.BookingAvailabilityResponse;
import smart_campus_backend.booking.dto.BookingRequest;
import smart_campus_backend.booking.dto.BookingResponse;
import smart_campus_backend.booking.entity.Booking;
import smart_campus_backend.booking.entity.BookingStatus;
import smart_campus_backend.booking.entity.BookingAudit;
import smart_campus_backend.booking.repository.BookingAuditRepository;
import smart_campus_backend.booking.repository.BookingRepository;
import smart_campus_backend.notification.service.NotificationService;
import smart_campus_backend.resource.entity.CampusResource;
import smart_campus_backend.resource.repository.CampusResourceRepository;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {
    private static final List<BookingStatus> CAPACITY_COUNTABLE_STATUSES =
            Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED);
    private static final List<BookingStatus> APPROVAL_CAPACITY_STATUSES =
            List.of(BookingStatus.APPROVED);

    private final BookingRepository bookingRepository;
    private final CampusResourceRepository resourceRepository;
    private final BookingAuditRepository auditRepository;
    private final NotificationService notificationService;

    @Transactional
    public BookingResponse createBooking(BookingRequest request, User user) {
        CampusResource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new EntityNotFoundException("Resource not found with ID: " + request.getResourceId()));

        validateBookingRequest(request, resource);

        BookingAvailabilityResponse availability = getAvailability(
                request.getResourceId(),
                request.getDate(),
                request.getStartTime(),
                request.getEndTime()
        );
        boolean shouldWaitlist = request.getAttendees() > availability.getRemainingCapacity();

        Booking booking = Booking.builder()
                .user(user)
                .resource(resource)
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .attendees(request.getAttendees())
                .status(shouldWaitlist ? BookingStatus.WAITLISTED : BookingStatus.PENDING)
                .build();
        if (shouldWaitlist) {
            booking.setWaitlistedAt(LocalDateTime.now());
        }

        Booking saved = bookingRepository.save(booking);
        createAuditLog(saved, shouldWaitlist ? "WAITLISTED" : "CREATED", user.getName());
        if (shouldWaitlist) {
            notificationService.createNotification(
                    booking.getUser(),
                    "Your booking request for " + booking.getResource().getName() + " on " + booking.getDate()
                            + " has been added to the WAITLIST due to full capacity."
            );
        }
        return mapToResponse(saved);
    }

    public BookingAvailabilityResponse getAvailability(Long resourceId, java.time.LocalDate date, LocalTime startTime, LocalTime endTime) {
        CampusResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new EntityNotFoundException("Resource not found with ID: " + resourceId));

        if (startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("End time must be later than start time");
        }

        Integer totalCapacity = resource.getCapacity() == null ? 0 : resource.getCapacity();
        Integer usedCapacity = bookingRepository.sumAttendeesForOverlappingBookings(
                resourceId,
                date,
                startTime,
                endTime,
                CAPACITY_COUNTABLE_STATUSES
        );
        int safeUsed = usedCapacity == null ? 0 : usedCapacity;
        int remaining = Math.max(totalCapacity - safeUsed, 0);

        return BookingAvailabilityResponse.builder()
                .resourceId(resourceId)
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .totalCapacity(totalCapacity)
                .usedCapacity(safeUsed)
                .remainingCapacity(remaining)
                .available(remaining > 0)
                .countedStatuses(CAPACITY_COUNTABLE_STATUSES.stream().map(Enum::name).collect(Collectors.toList()))
                .build();
    }

    private void validateBookingRequest(BookingRequest request, CampusResource resource) {
        if (request.getStartTime() == null || request.getEndTime() == null || !request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("End time must be later than start time");
        }
        if (Boolean.FALSE.equals(resource.getAvailable()) || resource.getStatus() != smart_campus_backend.resource.entity.ResourceStatus.ACTIVE) {
            throw new IllegalStateException("Selected resource is not available for booking");
        }
        if (request.getAttendees() > resource.getCapacity()) {
            throw new IllegalStateException("Attendees exceed resource maximum capacity (" + resource.getCapacity() + ")");
        }
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
    public BookingResponse approveBooking(Long id, ApproveBookingRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));

        if (booking.getStatus() == BookingStatus.APPROVED) {
            throw new IllegalStateException("Booking is already approved");
        }
        
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.WAITLISTED) {
            throw new IllegalStateException("Only pending or waitlisted bookings can be approved");
        }

        Integer approvedSeats = bookingRepository.sumAttendeesForOverlappingBookingsExcluding(
                booking.getResource().getId(),
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getId(),
                APPROVAL_CAPACITY_STATUSES
        );
        int safeApprovedSeats = approvedSeats == null ? 0 : approvedSeats;
        int remainingSeats = Math.max(booking.getResource().getCapacity() - safeApprovedSeats, 0);
        boolean forceOverride = request != null && Boolean.TRUE.equals(request.getForceOverride());
        String overrideReason = request == null ? null : request.getOverrideReason();
        boolean wouldExceedCapacity = booking.getAttendees() > remainingSeats;

        if (wouldExceedCapacity && !forceOverride) {
            throw new IllegalStateException(
                    "Cannot approve booking. Only " + remainingSeats + " seat(s) remaining in this slot."
            );
        }
        if (wouldExceedCapacity && forceOverride && (overrideReason == null || overrideReason.trim().isEmpty())) {
            throw new IllegalArgumentException("Override reason is required when approving over capacity");
        }

        boolean wasWaitlisted = booking.getStatus() == BookingStatus.WAITLISTED;
        booking.setStatus(BookingStatus.APPROVED);
        if (wasWaitlisted) {
            booking.setPromotedAt(LocalDateTime.now());
        }
        booking.setCapacityOverridden(wouldExceedCapacity && forceOverride);
        booking.setOverrideReason(wouldExceedCapacity && forceOverride ? overrideReason.trim() : null);
        Booking saved = bookingRepository.save(booking);
        createAuditLog(saved, booking.getCapacityOverridden() ? "APPROVED_OVERRIDE" : "APPROVED", "ADMIN");
        notificationService.createNotification(booking.getUser(), "Your booking for " + booking.getResource().getName() + " on " + booking.getDate() + " has been APPROVED.");
        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse rejectBooking(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.WAITLISTED) {
            throw new IllegalStateException("Only pending or waitlisted bookings can be rejected");
        }

        boolean freedCapacity = booking.getStatus() == BookingStatus.PENDING;
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        Booking saved = bookingRepository.save(booking);
        createAuditLog(saved, "REJECTED", "ADMIN");
        notificationService.createNotification(booking.getUser(), "Your booking for " + booking.getResource().getName() + " on " + booking.getDate() + " has been REJECTED. Reason: " + reason);
        if (freedCapacity) {
            processWaitlistForSlot(booking.getResource().getId(), booking.getDate(), booking.getStartTime(), booking.getEndTime());
        }
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

        boolean freedCapacity = booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.APPROVED;
        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);
        createAuditLog(saved, "CANCELLED", user.getName());
        if (freedCapacity) {
            processWaitlistForSlot(booking.getResource().getId(), booking.getDate(), booking.getStartTime(), booking.getEndTime());
        }
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
                .capacityOverridden(Boolean.TRUE.equals(booking.getCapacityOverridden()))
                .overrideReason(booking.getOverrideReason())
                .waitlistedAt(booking.getWaitlistedAt())
                .promotedAt(booking.getPromotedAt())
                .build();
    }

    private void processWaitlistForSlot(Long resourceId, java.time.LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<Booking> waitlisted = bookingRepository.findWaitlistedOverlappingBookingsFifo(
                resourceId,
                date,
                startTime,
                endTime,
                BookingStatus.WAITLISTED
        );

        for (Booking candidate : waitlisted) {
            Integer currentlyUsed = bookingRepository.sumAttendeesForOverlappingBookingsExcluding(
                    candidate.getResource().getId(),
                    candidate.getDate(),
                    candidate.getStartTime(),
                    candidate.getEndTime(),
                    candidate.getId(),
                    CAPACITY_COUNTABLE_STATUSES
            );
            int usedSeats = currentlyUsed == null ? 0 : currentlyUsed;
            int remainingSeats = Math.max(candidate.getResource().getCapacity() - usedSeats, 0);

            // Strict FIFO: stop promotion when first queued request cannot fit.
            if (candidate.getAttendees() > remainingSeats) {
                break;
            }

            candidate.setStatus(BookingStatus.APPROVED);
            candidate.setPromotedAt(LocalDateTime.now());
            Booking promoted = bookingRepository.save(candidate);
            createAuditLog(promoted, "PROMOTED_FROM_WAITLIST", "SYSTEM");
            notificationService.createNotification(
                    promoted.getUser(),
                    "Good news! Your waitlisted booking for " + promoted.getResource().getName() + " on "
                            + promoted.getDate() + " has been APPROVED."
            );
        }
    }
}
