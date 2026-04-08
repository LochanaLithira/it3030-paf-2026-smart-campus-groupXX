package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {

    @Query("""
            SELECT l FROM Location l
            WHERE (:building IS NULL OR LOWER(l.buildingName) LIKE LOWER(CONCAT('%', :building, '%')))
              AND (:floor IS NULL OR l.floorNumber = :floor)
            ORDER BY l.buildingName ASC, l.floorNumber ASC, l.roomNumber ASC
            """)
    List<Location> findAllByFilters(
            @Param("building") String building,
            @Param("floor") Integer floor
    );
}
