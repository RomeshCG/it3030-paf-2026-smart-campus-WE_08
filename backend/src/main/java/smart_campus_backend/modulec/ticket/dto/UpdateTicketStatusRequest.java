package smart_campus_backend.modulec.ticket.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import smart_campus_backend.modulec.ticket.TicketStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTicketStatusRequest {

    @NotNull
    private TicketStatus status;

    /**
     * Optional notes when moving to RESOLVED or CLOSED.
     */
    @Size(max = 4000)
    private String resolutionNotes;
}
