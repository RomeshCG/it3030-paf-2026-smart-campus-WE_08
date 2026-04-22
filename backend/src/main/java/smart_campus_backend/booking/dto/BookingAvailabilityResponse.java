package smart_campus_backend.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingAvailabilityResponse {
    private Long resourceId;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer totalCapacity;
    private Integer usedCapacity;
    private Integer remainingCapacity;
    private Boolean available;
}
