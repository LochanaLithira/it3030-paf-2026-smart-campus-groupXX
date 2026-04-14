package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.LocationAvailability;
import com.smartcampus.backend.model.enums.DayOfWeek;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocationAvailabilityRepository extends JpaRepository<LocationAvailability, UUID> {

    List<LocationAvailability> findByLocation_LocationId(UUID locationId);

    List<LocationAvailability> findByLocation_LocationIdAndDayOfWeek(UUID locationId, DayOfWeek dayOfWeek);
}
