package smart_campus_backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateUserRoleRequest {
    @NotBlank
    private String role;
}
