package smart_campus_backend.modulec.ticket.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import smart_campus_backend.auth.entity.User;

import java.time.Instant;

@Entity
@Table(name = "ticket_attachments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(nullable = false)
    private String fileName;

    /**
     * Public URL for the stored attachment (Cloudinary secure URL).
     */
    @Column(nullable = false, length = 1024)
    private String filePath;

    /**
     * Cloudinary public ID, used to delete the remote asset safely.
     */
    @Column(length = 255)
    private String cloudinaryPublicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    @Column(nullable = false)
    private Instant uploadedAt;

    @PrePersist
    void prePersist() {
        if (uploadedAt == null) {
            uploadedAt = Instant.now();
        }
    }
}
