package smart_campus_backend.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminInviteResponse {
    private Long id;
    private String email;
    private String targetRole;
    private String status;
    private String inviteUrl;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
