package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByUser_UserId(UUID userId);

    List<Booking> findByStatus(BookingStatus status);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.resource.resourceId = :resourceId
        AND b.bookingDate = :date
        AND b.status NOT IN ('REJECTED', 'CANCELLED')
        AND b.startTime < :endTime
        AND b.endTime > :startTime
    """)
    boolean existsConflict(
        @Param("resourceId") UUID resourceId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );
}