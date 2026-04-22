package smart_campus_backend.booking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import smart_campus_backend.auth.entity.User;
import smart_campus_backend.resource.entity.CampusResource;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "bookings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false)
    private CampusResource resource;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private String purpose;

    @Column(nullable = false)
    private Integer attendees;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "capacity_overridden", nullable = false)
    @Builder.Default
    private Boolean capacityOverridden = false;

    @Column(name = "override_reason")
    private String overrideReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
}
