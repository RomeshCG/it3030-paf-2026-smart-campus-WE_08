package smart_campus_backend.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smart_campus_backend.auth.entity.User;
import smart_campus_backend.booking.entity.Booking;
import smart_campus_backend.booking.entity.BookingStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserOrderByDateDescStartTimeDesc(User user);

    List<Booking> findAllByOrderByDateDescStartTimeDesc();

    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
           "WHERE b.resource.id = :resourceId " +
           "AND b.date = :date " +
           "AND b.status IN :activeStatuses " +
           "AND ((b.startTime < :endTime AND b.endTime > :startTime))")
    boolean existsOverlappingBooking(@Param("resourceId") Long resourceId,
                                    @Param("date") LocalDate date,
                                    @Param("startTime") LocalTime startTime,
                                    @Param("endTime") LocalTime endTime,
                                    @Param("activeStatuses") List<BookingStatus> activeStatuses);

    @Query("SELECT b.resource.name, COUNT(b) FROM Booking b GROUP BY b.resource.name")
    List<Object[]> countBookingsByResource();

    @Query("SELECT HOUR(b.startTime), COUNT(b) FROM Booking b GROUP BY HOUR(b.startTime)")
    List<Object[]> countBookingsByHour();
}
