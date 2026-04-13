package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.ResourceAvailability;
import com.smartcampus.backend.model.enums.DayOfWeek;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceAvailabilityRepository extends JpaRepository<ResourceAvailability, UUID> {

    List<ResourceAvailability> findByResource_ResourceIdAndDayOfWeek(UUID resourceId, DayOfWeek dayOfWeek);
}