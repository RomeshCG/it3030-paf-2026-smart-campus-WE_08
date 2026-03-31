package smart_campus_backend.resource.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smart_campus_backend.resource.dto.DashboardStats;
import smart_campus_backend.resource.dto.ResourceDTO;
import smart_campus_backend.resource.service.CampusResourceService;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class CampusResourceController {

    private final CampusResourceService service;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        
        List<ResourceDTO> all = service.getAll(type, status, minCapacity, name);
        int total = all.size();
        
        // Manual pagination
        int start = Math.min(page * size, total);
        int end = Math.min((page + 1) * size, total);
        List<ResourceDTO> content = all.subList(start, end);

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalPages", (int) Math.ceil((double) total / size));
        response.put("totalElements", total);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<ResourceDTO> create(@RequestBody ResourceDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceDTO> update(@PathVariable Long id, @RequestBody ResourceDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
