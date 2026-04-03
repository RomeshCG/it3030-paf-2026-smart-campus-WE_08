package smart_campus_backend.modulec.ticket.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import smart_campus_backend.modulec.ticket.entity.Ticket;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Page<Ticket> findByCreatedByIdOrderByCreatedAtDesc(Long createdById, Pageable pageable);

    Page<Ticket> findByAssignedTechnicianIdOrderByCreatedAtDesc(Long technicianId, Pageable pageable);

    Page<Ticket> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
