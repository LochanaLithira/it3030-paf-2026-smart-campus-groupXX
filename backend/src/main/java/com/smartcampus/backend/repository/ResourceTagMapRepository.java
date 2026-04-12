package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.ResourceTagMap;
import com.smartcampus.backend.model.ResourceTagMapId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceTagMapRepository extends JpaRepository<ResourceTagMap, ResourceTagMapId> {
}
