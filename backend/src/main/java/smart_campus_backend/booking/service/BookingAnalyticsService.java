package smart_campus_backend.booking.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smart_campus_backend.booking.dto.BookingAnalyticsResponse;
import smart_campus_backend.booking.repository.BookingRepository;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingAnalyticsService {

    private final BookingRepository bookingRepository;

    public BookingAnalyticsResponse getBookingAnalytics() {
        long total = bookingRepository.count();

        List<Object[]> resourceResults = bookingRepository.countBookingsByResource();
        Map<String, Long> resourceUsage = new HashMap<>();
        for (Object[] res : resourceResults) {
            String name = res[0] != null ? res[0].toString() : "Unknown";
            long count = res[1] instanceof Number ? ((Number) res[1]).longValue() : 0L;
            resourceUsage.put(name, count);
        }

        List<Object[]> hourResults = bookingRepository.countBookingsByHour();
        Map<Integer, Long> hourUsage = new HashMap<>();
        for (Object[] hr : hourResults) {
            if (hr[0] != null) {
                int hour = hr[0] instanceof Number ? ((Number) hr[0]).intValue() : 0;
                long count = hr[1] instanceof Number ? ((Number) hr[1]).longValue() : 0L;
                hourUsage.put(hour, count);
            }
        }

        return BookingAnalyticsResponse.builder()
                .totalBookings(total)
                .bookingsByResource(resourceUsage)
                .bookingsByHour(hourUsage)
                .build();
    }
}
