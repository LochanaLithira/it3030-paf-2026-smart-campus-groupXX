package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.model.enums.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    @Query(value = """
            SELECT DISTINCT r.* FROM resources r
            LEFT JOIN locations l ON l.location_id = r.location_id
            LEFT JOIN resource_tag_map tm ON r.resource_id = tm.resource_id
            LEFT JOIN resource_tags t ON t.tag_id = tm.tag_id
            WHERE (:type IS NULL OR r.type = CAST(:type AS resource_type))
              AND (:status IS NULL OR r.status = CAST(:status AS resource_status))
              AND (:locationId IS NULL OR l.location_id = CAST(CAST(:locationId AS TEXT) AS UUID))
              AND (:minCapacity IS NULL OR r.capacity >= CAST(:minCapacity AS INT))
              AND (:search IS NULL OR r.name ILIKE '%' || :search || '%' OR COALESCE(r.description, '') ILIKE '%' || :search || '%')
              AND (:tagName IS NULL OR t.tag_name ILIKE :tagName)
            ORDER BY r.created_at ASC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT r.resource_id) FROM resources r
            LEFT JOIN locations l ON l.location_id = r.location_id
            LEFT JOIN resource_tag_map tm ON r.resource_id = tm.resource_id
            LEFT JOIN resource_tags t ON t.tag_id = tm.tag_id
            WHERE (:type IS NULL OR r.type = CAST(:type AS resource_type))
              AND (:status IS NULL OR r.status = CAST(:status AS resource_status))
              AND (:locationId IS NULL OR l.location_id = CAST(CAST(:locationId AS TEXT) AS UUID))
              AND (:minCapacity IS NULL OR r.capacity >= CAST(:minCapacity AS INT))
              AND (:search IS NULL OR r.name ILIKE '%' || :search || '%' OR COALESCE(r.description, '') ILIKE '%' || :search || '%')
              AND (:tagName IS NULL OR t.tag_name ILIKE :tagName)
            """,
            nativeQuery = true)
    Page<Resource> findAllWithFilters(
            @Param("type") String type,
            @Param("status") String status,
            @Param("locationId") UUID locationId,
            @Param("minCapacity") Integer minCapacity,
            @Param("search") String search,
            @Param("tagName") String tagName,
            Pageable pageable
    );

    @Query("""
            SELECT DISTINCT r
            FROM Resource r
            LEFT JOIN r.location l
            LEFT JOIN r.tagMappings tm
            LEFT JOIN tm.tag t
            WHERE (:type IS NULL OR r.type = :type)
              AND (:status IS NULL OR r.status = :status)
              AND (:locationId IS NULL OR l.locationId = :locationId)
              AND (:minCapacity IS NULL OR r.capacity >= :minCapacity)
              AND (:search IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(r.description, '')) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:tagName IS NULL OR LOWER(t.tagName) = LOWER(:tagName))
            """)
    Page<Resource> findPagedWithFilters(
            @Param("type") ResourceType type,
            @Param("status") ResourceStatus status,
            @Param("locationId") UUID locationId,
            @Param("minCapacity") Integer minCapacity,
            @Param("search") String search,
            @Param("tagName") String tagName,
            Pageable pageable
    );

    // Hydration step A: fetch location + tagMappings for a known set of IDs
    @Query("""
            SELECT DISTINCT r
            FROM Resource r
            LEFT JOIN FETCH r.location
            LEFT JOIN FETCH r.createdBy
            LEFT JOIN FETCH r.tagMappings tm
            LEFT JOIN FETCH tm.tag
            WHERE r.resourceId IN :ids
            """)
    List<Resource> findAllWithTagsByIds(@Param("ids") List<UUID> ids);

    // Hydration step B: fetch availability for the same set of IDs
    // (runs in the same transaction so Hibernate 1st-level cache merges the results)
    @Query("""
            SELECT DISTINCT r
            FROM Resource r
            LEFT JOIN FETCH r.availability
            WHERE r.resourceId IN :ids
            """)
    List<Resource> findAllWithAvailabilityByIds(@Param("ids") List<UUID> ids);

    // Single resource: step A — fetch location + tagMappings
    @Query("""
            SELECT DISTINCT r
            FROM Resource r
            LEFT JOIN FETCH r.location
            LEFT JOIN FETCH r.createdBy
            LEFT JOIN FETCH r.tagMappings tm
            LEFT JOIN FETCH tm.tag
            WHERE r.resourceId = :resourceId
            """)
    Optional<Resource> findByIdWithTags(@Param("resourceId") UUID resourceId);

    // Single resource: step B — fetch availability
    @Query("""
            SELECT DISTINCT r
            FROM Resource r
            LEFT JOIN FETCH r.availability
            WHERE r.resourceId = :resourceId
            """)
    Optional<Resource> findByIdWithAvailability(@Param("resourceId") UUID resourceId);

    boolean existsByLocation_LocationId(UUID locationId);
}