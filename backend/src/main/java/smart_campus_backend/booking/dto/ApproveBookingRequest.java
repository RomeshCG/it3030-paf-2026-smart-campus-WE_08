package smart_campus_backend.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApproveBookingRequest {
    private Boolean forceOverride;
    private String overrideReason;
}
