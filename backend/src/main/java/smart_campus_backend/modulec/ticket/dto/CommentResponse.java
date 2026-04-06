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
public class CommentResponse {

    private Long id;
    private Long authorId;
    private String authorName;
    private String message;
    private Instant createdAt;
    private Instant updatedAt;
}
