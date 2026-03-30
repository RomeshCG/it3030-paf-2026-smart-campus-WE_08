package smart_campus_backend.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import smart_campus_backend.auth.dto.UpdateUserBanRequest;
import smart_campus_backend.auth.dto.UpdateUserRoleRequest;
import smart_campus_backend.auth.dto.UserManagementUserResponse;
import smart_campus_backend.auth.service.AdminUserManagementService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminUserManagementController {

    private final AdminUserManagementService adminUserManagementService;

    @GetMapping
    public ResponseEntity<List<UserManagementUserResponse>> listUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(adminUserManagementService.listUsers(role, status, search));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserManagementUserResponse> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                adminUserManagementService.updateUserRole(id, request.getRole(), authentication)
        );
    }

    @PatchMapping("/{id}/ban")
    public ResponseEntity<UserManagementUserResponse> updateBanStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserBanRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                adminUserManagementService.updateUserBanStatus(id, request.isBanned(), authentication)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            Authentication authentication
    ) {
        adminUserManagementService.deleteUser(id, authentication);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
