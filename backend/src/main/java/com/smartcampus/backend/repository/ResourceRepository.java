package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.model.enums.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID>, JpaSpecificationExecutor<Resource> {

        // Hydration step A: fetch creator + tagMappings for a known set of IDs
    @Query("""
            SELECT DISTINCT r
            FROM Resource r
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

        // Single resource: step A — fetch creator + tagMappings
    @Query("""
            SELECT DISTINCT r
            FROM Resource r
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

    List<Resource> findTop8ByTypeAndStatusAndResourceIdNotOrderByNameAsc(
            ResourceType type,
            ResourceStatus status,
            UUID resourceId
    );
}