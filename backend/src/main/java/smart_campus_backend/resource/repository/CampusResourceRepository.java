package smart_campus_backend.resource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import smart_campus_backend.resource.entity.CampusResource;
import smart_campus_backend.resource.entity.ResourceStatus;
import smart_campus_backend.resource.entity.ResourceType;

import java.util.List;

@Repository
public interface CampusResourceRepository extends JpaRepository<CampusResource, Long> {

    List<CampusResource> findByType(ResourceType type);

    List<CampusResource> findByStatus(ResourceStatus status);

    List<CampusResource> findByTypeAndStatus(ResourceType type, ResourceStatus status);

    List<CampusResource> findByCapacityGreaterThanEqual(Integer minCapacity);

    @Query("SELECT COUNT(r) FROM CampusResource r WHERE r.status = 'ACTIVE'")
    long countActive();

    @Query("SELECT COUNT(r) FROM CampusResource r WHERE r.status = 'OUT_OF_SERVICE'")
    long countOutOfService();
}
