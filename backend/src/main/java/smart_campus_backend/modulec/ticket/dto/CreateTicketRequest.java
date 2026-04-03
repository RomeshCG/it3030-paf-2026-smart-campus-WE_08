package smart_campus_backend.modulec.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import smart_campus_backend.modulec.ticket.TicketCategory;
import smart_campus_backend.modulec.ticket.TicketPriority;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotNull
    private TicketCategory category;

    @NotBlank
    @Size(max = 4000)
    private String description;

    @NotNull
    private TicketPriority priority;

    @Size(max = 500)
    private String preferredContactDetails;

    @Size(max = 500)
    private String locationOrResource;
}
