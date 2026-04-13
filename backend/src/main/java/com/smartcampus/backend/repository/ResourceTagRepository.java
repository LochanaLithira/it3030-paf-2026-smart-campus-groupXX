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

    boolean existsByTagNameIgnoreCase(String tagName);

    Optional<ResourceTag> findByTagNameIgnoreCase(String tagName);

    @Query("select count(m) from ResourceTagMap m where m.tagId = :tagId")
    long countResourceMappings(@Param("tagId") UUID tagId);

    @Query("select count(m) from LocationTagMap m where m.tagId = :tagId")
    long countLocationMappings(@Param("tagId") UUID tagId);
}