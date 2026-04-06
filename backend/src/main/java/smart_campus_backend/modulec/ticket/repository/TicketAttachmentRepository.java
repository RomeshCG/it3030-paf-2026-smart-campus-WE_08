package smart_campus_backend.modulec.ticket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import smart_campus_backend.modulec.ticket.entity.TicketAttachment;

import java.util.List;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {

    long countByTicketId(Long ticketId);

    List<TicketAttachment> findByTicketIdOrderByUploadedAtAsc(Long ticketId);
}
