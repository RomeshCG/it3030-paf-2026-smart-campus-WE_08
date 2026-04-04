package smart_campus_backend.booking.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import smart_campus_backend.booking.dto.BookingAnalyticsResponse;
import smart_campus_backend.booking.service.BookingAnalyticsService;

@RestController
@RequestMapping("/api/analytics/bookings")
@RequiredArgsConstructor
public class BookingAnalyticsController {

    private final BookingAnalyticsService analyticsService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingAnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getBookingAnalytics());
    }
}
