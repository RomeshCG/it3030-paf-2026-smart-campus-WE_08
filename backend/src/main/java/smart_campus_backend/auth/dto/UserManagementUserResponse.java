package smart_campus_backend.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserManagementUserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private boolean enabled;
}
