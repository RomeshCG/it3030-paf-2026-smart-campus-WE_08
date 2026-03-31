package smart_campus_backend.auth.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import smart_campus_backend.auth.dto.UserManagementUserResponse;
import smart_campus_backend.auth.entity.Role;
import smart_campus_backend.auth.entity.User;
import smart_campus_backend.auth.repository.UserRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AdminUserManagementService {

    private final UserRepository userRepository;

    public List<UserManagementUserResponse> listUsers(String role, String status, String search) {
        Specification<User> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (role != null && !role.isBlank()) {
                Role normalizedRole = normalizeRole(role);
                predicates.add(cb.equal(root.get("role"), normalizedRole));
            }

            if (status != null && !status.isBlank()) {
                String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
                if ("ACTIVE".equals(normalizedStatus)) {
                    predicates.add(cb.isTrue(root.get("enabled")));
                } else if ("BANNED".equals(normalizedStatus)) {
                    predicates.add(cb.isFalse(root.get("enabled")));
                }
            }

            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), searchPattern),
                        cb.like(cb.lower(root.get("email")), searchPattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(specification, Sort.by(Sort.Direction.ASC, "id"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public UserManagementUserResponse updateUserRole(Long id, String requestedRole, Authentication authentication) {
        User targetUser = getUser(id);
        Role normalizedRole = normalizeRole(requestedRole);

        protectLastSuperAdminRoleChange(targetUser, normalizedRole);
        protectSelfRoleChange(authentication, targetUser);

        targetUser.setRole(normalizedRole);
        return toResponse(userRepository.save(targetUser));
    }

    public UserManagementUserResponse updateUserBanStatus(Long id, boolean banned, Authentication authentication) {
        User targetUser = getUser(id);
        protectSelfChange(authentication, targetUser);

        if (isSuperAdmin(targetUser) && banned) {
            long superAdminCount = userRepository.countByRole(Role.SUPER_ADMIN);
            if (superAdminCount <= 1) {
                throw new RuntimeException("Cannot ban the last SUPER_ADMIN");
            }
        }

        targetUser.setEnabled(!banned);
        return toResponse(userRepository.save(targetUser));
    }

    public void deleteUser(Long id, Authentication authentication) {
        User targetUser = getUser(id);
        protectSelfChange(authentication, targetUser);

        if (isSuperAdmin(targetUser)) {
            long superAdminCount = userRepository.countByRole(Role.SUPER_ADMIN);
            if (superAdminCount <= 1) {
                throw new RuntimeException("Cannot delete the last SUPER_ADMIN");
            }
        }

        userRepository.delete(targetUser);
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserManagementUserResponse toResponse(User user) {
        return UserManagementUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole() == null ? Role.USER.name() : user.getRole().name())
                .enabled(user.isEnabled())
                .build();
    }

    private Role normalizeRole(String role) {
        return Role.fromStoredValue(role);
    }

    private boolean isSuperAdmin(User user) {
        return user.getRole() == Role.SUPER_ADMIN;
    }

    private void protectSelfChange(Authentication authentication, User targetUser) {
        String currentUserEmail = authentication.getName();
        if (currentUserEmail.equalsIgnoreCase(targetUser.getEmail())) {
            throw new RuntimeException("You cannot modify your own account with this action");
        }
    }

    private void protectSelfRoleChange(Authentication authentication, User targetUser) {
        String currentUserEmail = authentication.getName();
        if (currentUserEmail.equalsIgnoreCase(targetUser.getEmail())) {
            throw new RuntimeException("You cannot change your own role");
        }
    }

    private void protectLastSuperAdminRoleChange(User targetUser, Role nextRole) {
        if (isSuperAdmin(targetUser) && nextRole != Role.SUPER_ADMIN) {
            long superAdminCount = userRepository.countByRole(Role.SUPER_ADMIN);
            if (superAdminCount <= 1) {
                throw new RuntimeException("Cannot downgrade the last SUPER_ADMIN");
            }
        }
    }
}
