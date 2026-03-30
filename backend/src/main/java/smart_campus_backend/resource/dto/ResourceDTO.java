package smart_campus_backend.resource.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import smart_campus_backend.resource.entity.ResourceStatus;
import smart_campus_backend.resource.entity.ResourceType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceDTO {
    private Long id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private ResourceStatus status;
    private String imageUrl;
    private String description;
    private String downloadUrl;
    private Boolean available;
}
