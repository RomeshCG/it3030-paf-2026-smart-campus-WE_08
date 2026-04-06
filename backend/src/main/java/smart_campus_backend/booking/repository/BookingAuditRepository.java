package smart_campus_backend.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smart_campus_backend.booking.entity.BookingAudit;

import java.util.List;

@Repository
public interface BookingAuditRepository extends JpaRepository<BookingAudit, Long> {
    List<BookingAudit> findByBookingIdOrderByTimestampDesc(Long bookingId);
}
