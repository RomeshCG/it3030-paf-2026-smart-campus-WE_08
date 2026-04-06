package smart_campus_backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminInviteCreateRequest {
    @NotBlank
    @Email
    private String email;
}
