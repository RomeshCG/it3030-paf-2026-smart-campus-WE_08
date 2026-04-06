package smart_campus_backend.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import smart_campus_backend.auth.dto.AdminInviteCreateRequest;
import smart_campus_backend.auth.dto.AdminInviteResponse;
import smart_campus_backend.auth.service.AdminInviteService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/invites")
@RequiredArgsConstructor
public class AdminInviteController {

    private final AdminInviteService adminInviteService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminInviteResponse> createInvite(@Valid @RequestBody AdminInviteCreateRequest request) {
        return ResponseEntity.ok(adminInviteService.createInvite(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<AdminInviteResponse>> listInvites() {
        return ResponseEntity.ok(adminInviteService.listInvites());
    }
}
