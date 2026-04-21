package smart_campus_backend.modulec.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianOptionResponse {
    private Long id;
    private String name;
    private String email;
}
