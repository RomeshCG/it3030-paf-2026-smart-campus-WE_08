package smart_campus_backend.modulec.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {

    private Long id;
    private String fileName;
    private String filePath;
    private Long uploadedById;
    private String uploadedByName;
    private Instant uploadedAt;
}
