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

    // Step 1: Paginate on the base table only — no collection JOIN FETCH here
    @Query(value = """
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
            """,
            countQuery = """
            SELECT COUNT(DISTINCT r)
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

    // Step 2: Hydrate a known set of IDs — safe to JOIN FETCH collections here
    @Query("""
            SELECT DISTINCT r
            FROM Resource r
            LEFT JOIN FETCH r.location
            LEFT JOIN FETCH r.createdBy
            LEFT JOIN FETCH r.availability
            LEFT JOIN FETCH r.tagMappings tm
            LEFT JOIN FETCH tm.tag
            WHERE r.resourceId IN :ids
            """)
    List<Resource> findAllWithDetailsByIds(@Param("ids") List<UUID> ids);

    // Used by getById, update, delete — unchanged, correct as-is
    @Query("""
            SELECT DISTINCT r
            FROM Resource r
            LEFT JOIN FETCH r.location
            LEFT JOIN FETCH r.createdBy
            LEFT JOIN FETCH r.availability
            LEFT JOIN FETCH r.tagMappings tm
            LEFT JOIN FETCH tm.tag
            WHERE r.resourceId = :resourceId
            """)
    Optional<Resource> findByIdWithDetails(@Param("resourceId") UUID resourceId);

    boolean existsByLocation_LocationId(UUID locationId);
}
