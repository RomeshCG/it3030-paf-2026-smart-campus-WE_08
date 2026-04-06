package smart_campus_backend.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import smart_campus_backend.auth.entity.AdminInvite;

import java.util.Optional;

public interface AdminInviteRepository extends JpaRepository<AdminInvite, Long> {
    Optional<AdminInvite> findByToken(String token);
}
