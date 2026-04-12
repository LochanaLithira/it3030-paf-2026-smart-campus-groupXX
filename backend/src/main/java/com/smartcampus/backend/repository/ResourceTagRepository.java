package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.ResourceTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceTagRepository extends JpaRepository<ResourceTag, UUID> {
    List<ResourceTag> findByTagIdIn(List<UUID> tagIds);
}