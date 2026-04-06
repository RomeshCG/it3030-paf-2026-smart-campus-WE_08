package smart_campus_backend.resource.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "campus_resources")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampusResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false)
    private ResourceType type;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_status", nullable = false)
    @Builder.Default
    private ResourceStatus status = ResourceStatus.ACTIVE;

    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String downloadUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean available = true;
}
