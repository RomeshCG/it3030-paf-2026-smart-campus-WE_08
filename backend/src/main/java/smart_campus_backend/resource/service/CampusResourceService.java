package smart_campus_backend.resource.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import smart_campus_backend.booking.entity.Booking;
import smart_campus_backend.booking.entity.BookingStatus;
import smart_campus_backend.booking.repository.BookingRepository;
import smart_campus_backend.resource.dto.DashboardStats;
import smart_campus_backend.resource.dto.ResourceDTO;
import smart_campus_backend.resource.entity.CampusResource;
import smart_campus_backend.resource.entity.ResourceStatus;
import smart_campus_backend.resource.entity.ResourceType;
import smart_campus_backend.resource.repository.CampusResourceRepository;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampusResourceService {

    private final CampusResourceRepository repo;
    private final BookingRepository bookingRepository;
    private final Cloudinary cloudinary;
    private static final Set<String> ALLOWED_IMAGE_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp"
    );
    private static final Set<BookingStatus> CAPACITY_HOLDING_STATUSES = Set.of(BookingStatus.PENDING, BookingStatus.APPROVED);

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
        validateCapacity(dto.getCapacity());
        assertNoDuplicate(dto, null);
        CampusResource entity = toEntity(dto);
        return toDTO(repo.save(entity));
    }

    public ResourceDTO update(Long id, ResourceDTO dto) {
        CampusResource existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        validateCapacity(dto.getCapacity());
        validateCapacityReduction(existing, dto.getCapacity());
        assertNoDuplicate(dto, id);
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

    public String uploadResourceImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Only image uploads are allowed (JPEG, PNG, GIF, WebP)");
        }
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "smart-campus/resources",
                            "resource_type", "image",
                            "transformation", "f_auto,q_auto:good"
                    )
            );
            Object secureUrl = uploadResult.get("secure_url");
            if (secureUrl == null) {
                throw new IllegalArgumentException("Cloudinary did not return an image URL");
            }
            return secureUrl.toString();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to upload resource image", ex);
        }
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

    private void assertNoDuplicate(ResourceDTO dto, Long excludeId) {
        if (dto.getName() == null || dto.getLocation() == null || dto.getType() == null || dto.getCapacity() == null) {
            return;
        }

        String name = dto.getName().trim();
        String location = dto.getLocation().trim();
        boolean duplicate = excludeId == null
                ? repo.existsDuplicate(name, location, dto.getType(), dto.getCapacity())
                : repo.existsDuplicateExcluding(name, location, dto.getType(), dto.getCapacity(), excludeId);

        if (duplicate) {
            throw new IllegalArgumentException("Duplicate resource detected. A resource with same name, type, location, and capacity already exists.");
        }
    }

    private void validateCapacity(Integer capacity) {
        if (capacity == null || capacity < 1) {
            throw new IllegalArgumentException("Maximum capacity must be at least 1");
        }
    }

    private void validateCapacityReduction(CampusResource existing, Integer nextCapacity) {
        if (existing.getCapacity() == null || nextCapacity >= existing.getCapacity()) {
            return;
        }
        int peakReservedSeats = calculatePeakReservedSeats(existing.getId());
        if (nextCapacity < peakReservedSeats) {
            throw new IllegalStateException(
                    "Cannot reduce capacity below currently reserved seat demand (" + peakReservedSeats + ")."
            );
        }
    }

    private int calculatePeakReservedSeats(Long resourceId) {
        LocalDate today = LocalDate.now();
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(booking -> booking.getResource() != null && resourceId.equals(booking.getResource().getId()))
                .filter(booking -> booking.getDate() != null && !booking.getDate().isBefore(today))
                .filter(booking -> CAPACITY_HOLDING_STATUSES.contains(booking.getStatus()))
                .filter(booking -> booking.getAttendees() != null && booking.getAttendees() > 0)
                .toList();

        Map<LocalDate, List<int[]>> eventsByDate = new java.util.HashMap<>();
        for (Booking booking : bookings) {
            if (booking.getStartTime() == null || booking.getEndTime() == null) {
                continue;
            }
            int start = booking.getStartTime().getHour() * 60 + booking.getStartTime().getMinute();
            int end = booking.getEndTime().getHour() * 60 + booking.getEndTime().getMinute();
            List<int[]> events = eventsByDate.computeIfAbsent(booking.getDate(), ignored -> new java.util.ArrayList<>());
            events.add(new int[]{start, booking.getAttendees(), 1});
            events.add(new int[]{end, -booking.getAttendees(), 0});
        }

        int globalPeak = 0;
        for (List<int[]> events : eventsByDate.values()) {
            events.sort(Comparator
                    .comparingInt((int[] event) -> event[0])
                    .thenComparingInt(event -> event[2]));
            int active = 0;
            int peak = 0;
            for (int[] event : events) {
                active += event[1];
                if (active > peak) {
                    peak = active;
                }
            }
            if (peak > globalPeak) {
                globalPeak = peak;
            }
        }
        return globalPeak;
    }
}
