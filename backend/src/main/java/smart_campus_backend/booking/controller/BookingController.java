package smart_campus_backend.booking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import smart_campus_backend.auth.entity.User;
import smart_campus_backend.auth.repository.UserRepository;
import smart_campus_backend.booking.dto.BookingRequest;
import smart_campus_backend.booking.dto.BookingResponse;
import smart_campus_backend.booking.dto.RejectBookingRequest;
import smart_campus_backend.booking.entity.BookingAudit;
import smart_campus_backend.booking.service.BookingService;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    @PostMapping
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetails != null ? getUserByEmail(userDetails.getUsername()) : getDefaultUser();
        return new ResponseEntity<>(bookingService.createBooking(request, user), HttpStatus.CREATED);
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetails != null ? getUserByEmail(userDetails.getUsername()) : getDefaultUser();
        return ResponseEntity.ok(bookingService.getMyBookings(user));
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<BookingResponse> approveBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable Long id,
            @Valid @RequestBody RejectBookingRequest request) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, request.getReason()));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetails != null ? getUserByEmail(userDetails.getUsername()) : getDefaultUser();
        return ResponseEntity.ok(bookingService.cancelBooking(id, user));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<BookingAudit>> getBookingHistory(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingHistory(id));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseGet(this::getDefaultUser);
    }

    private User getDefaultUser() {
        return userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No users available for demo"));
    }
}
