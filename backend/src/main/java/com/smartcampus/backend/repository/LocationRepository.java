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

    @Query(value = """
            SELECT * FROM locations l
            WHERE (:building IS NULL OR l.building_name ILIKE '%' || :building || '%')
              AND (:floor IS NULL OR l.floor_number = :floor)
            ORDER BY l.building_name ASC, l.floor_number ASC, l.room_number ASC
            """, nativeQuery = true)
    List<Location> findAllByFilters(
            @Param("building") String building,
            @Param("floor") Integer floor
    );
}
