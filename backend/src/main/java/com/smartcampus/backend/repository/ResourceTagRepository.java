package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.ResourceTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResourceTagRepository extends JpaRepository<ResourceTag, UUID> {
    List<ResourceTag> findByTagIdIn(List<UUID> tagIds);

    Optional<ResourceTag> findByTagNameIgnoreCase(String tagName);

    @Query("""
            SELECT COUNT(t) > 0 FROM ResourceTag t
            WHERE LOWER(t.tagName) = LOWER(:tagName) AND t.tagId <> :tagId
            """)
    boolean existsOtherWithNameIgnoreCase(@Param("tagName") String tagName, @Param("tagId") UUID tagId);
}