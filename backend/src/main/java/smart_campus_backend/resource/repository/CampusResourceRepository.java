package smart_campus_backend.resource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("SELECT COUNT(r) > 0 FROM CampusResource r " +
           "WHERE lower(trim(r.name)) = lower(trim(:name)) " +
           "AND lower(trim(r.location)) = lower(trim(:location)) " +
           "AND r.type = :type " +
           "AND r.capacity = :capacity")
    boolean existsDuplicate(@Param("name") String name,
                            @Param("location") String location,
                            @Param("type") ResourceType type,
                            @Param("capacity") Integer capacity);

    @Query("SELECT COUNT(r) > 0 FROM CampusResource r " +
           "WHERE lower(trim(r.name)) = lower(trim(:name)) " +
           "AND lower(trim(r.location)) = lower(trim(:location)) " +
           "AND r.type = :type " +
           "AND r.capacity = :capacity " +
           "AND r.id <> :excludeId")
    boolean existsDuplicateExcluding(@Param("name") String name,
                                     @Param("location") String location,
                                     @Param("type") ResourceType type,
                                     @Param("capacity") Integer capacity,
                                     @Param("excludeId") Long excludeId);
}
