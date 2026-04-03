package smart_campus_backend.modulec.ticket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import smart_campus_backend.modulec.ticket.entity.TicketComment;

import java.util.List;

public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {

    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
