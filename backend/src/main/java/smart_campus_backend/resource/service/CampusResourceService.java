package smart_campus_backend.resource.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smart_campus_backend.resource.dto.DashboardStats;
import smart_campus_backend.resource.dto.ResourceDTO;
import smart_campus_backend.resource.entity.CampusResource;
import smart_campus_backend.resource.entity.ResourceStatus;
import smart_campus_backend.resource.entity.ResourceType;
import smart_campus_backend.resource.repository.CampusResourceRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampusResourceService {

    private final CampusResourceRepository repo;

    public List<ResourceDTO> getAll(String type, String status, Integer minCapacity, String name) {
        List<CampusResource> results;

        if (type != null && status != null) {
            results = repo.findByTypeAndStatus(ResourceType.valueOf(type), ResourceStatus.valueOf(status));
        } else if (type != null && !type.isEmpty()) {
            results = repo.findByType(ResourceType.valueOf(type));
        } else if (status != null && !status.isEmpty()) {
            results = repo.findByStatus(ResourceStatus.valueOf(status));
        } else {
            results = repo.findAll();
        }

        if (minCapacity != null) {
            results = results.stream()
                    .filter(r -> r.getCapacity() >= minCapacity)
                    .collect(Collectors.toList());
        }

        if (name != null && !name.isEmpty()) {
            results = results.stream()
                    .filter(r -> r.getName().toLowerCase().contains(name.toLowerCase()))
                    .collect(Collectors.toList());
        }

        return results.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ResourceDTO getById(Long id) {
        return repo.findById(id).map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
    }

    public ResourceDTO create(ResourceDTO dto) {
        CampusResource entity = toEntity(dto);
        return toDTO(repo.save(entity));
    }

    public ResourceDTO update(Long id, ResourceDTO dto) {
        CampusResource existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        existing.setName(dto.getName());
        existing.setType(dto.getType());
        existing.setCapacity(dto.getCapacity());
        existing.setLocation(dto.getLocation());
        existing.setStatus(dto.getStatus());
        existing.setImageUrl(dto.getImageUrl());
        existing.setDescription(dto.getDescription());
        existing.setDownloadUrl(dto.getDownloadUrl());
        existing.setAvailable(dto.getAvailable());
        return toDTO(repo.save(existing));
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    public DashboardStats getStats() {
        return DashboardStats.builder()
                .total(repo.count())
                .active(repo.countActive())
                .outOfService(repo.countOutOfService())
                .build();
    }

    private ResourceDTO toDTO(CampusResource r) {
        return ResourceDTO.builder()
                .id(r.getId())
                .name(r.getName())
                .type(r.getType())
                .capacity(r.getCapacity())
                .location(r.getLocation())
                .status(r.getStatus())
                .imageUrl(r.getImageUrl())
                .description(r.getDescription())
                .downloadUrl(r.getDownloadUrl())
                .available(r.getAvailable())
                .build();
    }

    private CampusResource toEntity(ResourceDTO dto) {
        return CampusResource.builder()
                .name(dto.getName())
                .type(dto.getType())
                .capacity(dto.getCapacity())
                .location(dto.getLocation())
                .status(dto.getStatus() != null ? dto.getStatus() : ResourceStatus.ACTIVE)
                .imageUrl(dto.getImageUrl())
                .description(dto.getDescription())
                .downloadUrl(dto.getDownloadUrl())
                .available(dto.getAvailable() != null ? dto.getAvailable() : true)
                .build();
    }
}
