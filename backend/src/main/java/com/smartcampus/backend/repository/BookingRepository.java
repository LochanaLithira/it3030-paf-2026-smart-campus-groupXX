package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
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

    @EntityGraph(attributePaths = {"resource", "user", "resource.location"})
    Page<Booking> findByUser_UserId(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"resource", "user", "resource.location"})
    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.resource.resourceId = :resourceId
        AND b.bookingDate = :date
        AND b.status NOT IN (com.smartcampus.backend.model.enums.BookingStatus.REJECTED,
                             com.smartcampus.backend.model.enums.BookingStatus.CANCELLED)
        AND b.startTime < :endTime
        AND b.endTime > :startTime
    """)
    boolean existsConflict(
        @Param("resourceId") UUID resourceId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );

    @EntityGraph(attributePaths = {"resource", "user", "resource.location"})
    @Query("""
        SELECT b FROM Booking b
        LEFT JOIN b.resource r
        LEFT JOIN r.location l
        WHERE (:status IS NULL OR b.status = :status)
          AND (:resourceId IS NULL OR r.resourceId = :resourceId)
          AND (:userId IS NULL OR b.user.userId = :userId)
          AND (:locationId IS NULL OR l.locationId = :locationId)
          AND (:fromDate IS NULL OR b.bookingDate >= :fromDate)
          AND (:toDate IS NULL OR b.bookingDate <= :toDate)
        """)
    Page<Booking> findAllWithFilters(
            @Param("status") BookingStatus status,
            @Param("resourceId") UUID resourceId,
            @Param("userId") UUID userId,
            @Param("locationId") UUID locationId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"resource", "user", "resource.location"})
    @Query("""
        SELECT b FROM Booking b
        WHERE b.resource.resourceId = :resourceId
          AND b.bookingDate = :date
          AND b.status NOT IN (com.smartcampus.backend.model.enums.BookingStatus.REJECTED,
                               com.smartcampus.backend.model.enums.BookingStatus.CANCELLED)
        ORDER BY b.startTime ASC
        """)
    List<Booking> findActiveByResourceAndDate(
            @Param("resourceId") UUID resourceId,
            @Param("date") LocalDate date
    );
}