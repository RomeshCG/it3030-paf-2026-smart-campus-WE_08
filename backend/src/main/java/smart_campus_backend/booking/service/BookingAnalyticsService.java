package smart_campus_backend.booking.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smart_campus_backend.booking.dto.BookingAnalyticsResponse;
import smart_campus_backend.booking.repository.BookingRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingAnalyticsService {

    private final BookingRepository bookingRepository;

    public BookingAnalyticsResponse getBookingAnalytics() {
        long total = bookingRepository.count();

        List<Object[]> resourceResults = bookingRepository.countBookingsByResource();
        Map<String, Long> resourceUsage = new HashMap<>();
        for (Object[] res : resourceResults) {
            resourceUsage.put((String) res[0], (Long) res[1]);
        }

        List<Object[]> hourResults = bookingRepository.countBookingsByHour();
        Map<Integer, Long> hourUsage = new HashMap<>();
        for (Object[] hr : hourResults) {
            hourUsage.put((Integer) hr[0], (Long) hr[1]);
        }

        return BookingAnalyticsResponse.builder()
                .totalBookings(total)
                .bookingsByResource(resourceUsage)
                .bookingsByHour(hourUsage)
                .build();
    }
}
