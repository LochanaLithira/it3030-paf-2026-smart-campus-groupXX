package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.ResourceAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ResourceAvailabilityRepository extends JpaRepository<ResourceAvailability, UUID> {
}
