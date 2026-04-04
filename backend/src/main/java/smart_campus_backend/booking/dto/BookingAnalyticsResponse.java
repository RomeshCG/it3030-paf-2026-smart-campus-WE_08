package smart_campus_backend.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingAnalyticsResponse {
    private long totalBookings;
    private Map<String, Long> bookingsByResource;
    private Map<Integer, Long> bookingsByHour;
}
