package smart_campus_backend.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import smart_campus_backend.auth.dto.AdminInviteCreateRequest;
import smart_campus_backend.auth.dto.AdminInviteResponse;
import smart_campus_backend.auth.entity.AdminInvite;
import smart_campus_backend.auth.entity.InviteStatus;
import smart_campus_backend.auth.entity.Role;
import smart_campus_backend.auth.repository.AdminInviteRepository;
import smart_campus_backend.mail.InviteEmailService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminInviteService {

    private final AdminInviteRepository adminInviteRepository;
    private final InviteEmailService inviteEmailService;

    @Value("${app.invites.base-url:http://localhost:5173}")
    private String inviteBaseUrl;

    @Value("${app.invites.expiration-hours:72}")
    private long inviteExpirationHours;

    public AdminInviteResponse createInvite(AdminInviteCreateRequest request) {
        LocalDateTime now = LocalDateTime.now();
        AdminInvite invite = AdminInvite.builder()
                .email(request.getEmail().trim().toLowerCase())
                .token(UUID.randomUUID().toString())
                .targetRole(Role.ADMIN)
                .status(InviteStatus.PENDING)
                .createdAt(now)
                .expiresAt(now.plusHours(inviteExpirationHours))
                .build();

        AdminInvite saved = adminInviteRepository.save(invite);
        AdminInviteResponse response = toResponse(saved);
        inviteEmailService.sendAdminInvite(
                saved.getEmail(),
                response.getInviteUrl(),
                saved.getTargetRole().name(),
                inviteExpirationHours);
        return response;
    }

    public List<AdminInviteResponse> listInvites() {
        return adminInviteRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteInvite(Long inviteId) {
        AdminInvite invite = adminInviteRepository.findById(inviteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite not found"));
        adminInviteRepository.delete(invite);
    }

    private AdminInviteResponse toResponse(AdminInvite invite) {
        return AdminInviteResponse.builder()
                .id(invite.getId())
                .email(invite.getEmail())
                .targetRole(invite.getTargetRole().name())
                .status(invite.getStatus().name())
                .inviteUrl(inviteBaseUrl + "/onboarding/invite/" + invite.getToken())
                .createdAt(invite.getCreatedAt())
                .expiresAt(invite.getExpiresAt())
                .build();
    }
}
