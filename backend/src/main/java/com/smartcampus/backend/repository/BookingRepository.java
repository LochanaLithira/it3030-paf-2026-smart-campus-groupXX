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

    @EntityGraph(attributePaths = {"resource", "location", "user"})
    Page<Booking> findByUser_UserId(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"resource", "location", "user"})
    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.resource.resourceId = :resourceId
        AND b.bookingDate = :date
        AND b.status <> :rejectedStatus
        AND b.status <> :cancelledStatus
        AND b.startTime < :endTime
        AND b.endTime > :startTime
    """)
    boolean existsConflictInternal(
        @Param("resourceId") UUID resourceId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("rejectedStatus") BookingStatus rejectedStatus,
        @Param("cancelledStatus") BookingStatus cancelledStatus
    );

    default boolean existsConflict(
        UUID resourceId,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime
    ) {
        return existsConflictInternal(
            resourceId,
            date,
            startTime,
            endTime,
            BookingStatus.REJECTED,
            BookingStatus.CANCELLED
        );
    }

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.location.locationId = :locationId
        AND b.bookingDate = :date
        AND b.status <> :rejectedStatus
        AND b.status <> :cancelledStatus
        AND b.startTime < :endTime
        AND b.endTime > :startTime
    """)
    boolean existsLocationConflictInternal(
        @Param("locationId") UUID locationId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("rejectedStatus") BookingStatus rejectedStatus,
        @Param("cancelledStatus") BookingStatus cancelledStatus
    );

    default boolean existsLocationConflict(
        UUID locationId,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime
    ) {
        return existsLocationConflictInternal(
            locationId,
            date,
            startTime,
            endTime,
            BookingStatus.REJECTED,
            BookingStatus.CANCELLED
        );
    }

        @EntityGraph(attributePaths = {"resource", "location", "user"})
        @Query("""
                SELECT b FROM Booking b
                LEFT JOIN b.resource r
                LEFT JOIN b.location l
                WHERE b.status = :status
                    AND (:resourceId IS NULL OR r.resourceId = :resourceId)
                    AND (:locationId IS NULL OR l.locationId = :locationId)
                    AND (:userId IS NULL OR b.user.userId = :userId)
                    AND (:fromDate IS NULL OR b.bookingDate >= :fromDate)
                    AND (:toDate IS NULL OR b.bookingDate <= :toDate)
                """)
        Page<Booking> findAllWithStatusFilters(
                        @Param("status") BookingStatus status,
                        @Param("resourceId") UUID resourceId,
                        @Param("locationId") UUID locationId,
                        @Param("userId") UUID userId,
                        @Param("fromDate") LocalDate fromDate,
                        @Param("toDate") LocalDate toDate,
                        Pageable pageable
        );

        @EntityGraph(attributePaths = {"resource", "location", "user"})
        @Query("""
                SELECT b FROM Booking b
                LEFT JOIN b.resource r
                LEFT JOIN b.location l
                WHERE (:resourceId IS NULL OR r.resourceId = :resourceId)
                    AND (:locationId IS NULL OR l.locationId = :locationId)
                    AND (:userId IS NULL OR b.user.userId = :userId)
                    AND (:fromDate IS NULL OR b.bookingDate >= :fromDate)
                    AND (:toDate IS NULL OR b.bookingDate <= :toDate)
                """)
        Page<Booking> findAllWithoutStatusFilters(
                        @Param("resourceId") UUID resourceId,
                        @Param("locationId") UUID locationId,
                        @Param("userId") UUID userId,
                        @Param("fromDate") LocalDate fromDate,
                        @Param("toDate") LocalDate toDate,
                        Pageable pageable
        );

        default Page<Booking> findAllWithFilters(
                        BookingStatus status,
                        UUID resourceId,
                        UUID locationId,
                        UUID userId,
                        LocalDate fromDate,
                        LocalDate toDate,
                        Pageable pageable
        ) {
                if (status == null) {
                        return findAllWithoutStatusFilters(resourceId, locationId, userId, fromDate, toDate, pageable);
                }
                return findAllWithStatusFilters(status, resourceId, locationId, userId, fromDate, toDate, pageable);
        }

    @EntityGraph(attributePaths = {"resource", "location", "user"})
    @Query("""
        SELECT b FROM Booking b
        WHERE b.resource.resourceId = :resourceId
          AND b.bookingDate = :date
          AND b.status <> :rejectedStatus
          AND b.status <> :cancelledStatus
        ORDER BY b.startTime ASC
        """)
    List<Booking> findActiveByResourceAndDateInternal(
            @Param("resourceId") UUID resourceId,
            @Param("date") LocalDate date,
            @Param("rejectedStatus") BookingStatus rejectedStatus,
            @Param("cancelledStatus") BookingStatus cancelledStatus
    );

    default List<Booking> findActiveByResourceAndDate(UUID resourceId, LocalDate date) {
        return findActiveByResourceAndDateInternal(
            resourceId,
            date,
            BookingStatus.REJECTED,
            BookingStatus.CANCELLED
        );
    }

    @EntityGraph(attributePaths = {"resource", "location", "user"})
    @Query("""
        SELECT b FROM Booking b
        WHERE b.location.locationId = :locationId
          AND b.bookingDate = :date
          AND b.status <> :rejectedStatus
          AND b.status <> :cancelledStatus
        ORDER BY b.startTime ASC
        """)
    List<Booking> findActiveByLocationAndDateInternal(
            @Param("locationId") UUID locationId,
            @Param("date") LocalDate date,
            @Param("rejectedStatus") BookingStatus rejectedStatus,
            @Param("cancelledStatus") BookingStatus cancelledStatus
    );

    default List<Booking> findActiveByLocationAndDate(UUID locationId, LocalDate date) {
        return findActiveByLocationAndDateInternal(
            locationId,
            date,
            BookingStatus.REJECTED,
            BookingStatus.CANCELLED
        );
    }



    @Query(value = """
            SELECT
                r.name AS "resourceName",
                COUNT(b.booking_id)::INT AS "bookingCount"
            FROM bookings b
            JOIN resources r ON b.resource_id = r.resource_id
            WHERE b.status = 'APPROVED'
            GROUP BY r.resource_id, r.name
            ORDER BY "bookingCount" DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<TopResourceAggregate> findTopResources(@Param("limit") int limit);

    interface TopResourceAggregate {
        String getResourceName();
        Integer getBookingCount();
    }

    @Query(value = """
            WITH booking_hours AS (
                SELECT
                    generate_series(
                        DATE_PART('hour', b.start_time)::INT,
                        CASE 
                            WHEN DATE_PART('minute', b.end_time) > 0 THEN DATE_PART('hour', b.end_time)::INT
                            ELSE DATE_PART('hour', b.end_time)::INT - 1
                        END
                    ) AS hour_val,
                    b.booking_id
                FROM bookings b
                WHERE b.status = 'APPROVED'
            )
            SELECT
                hour_val AS "hourOfDay",
                COUNT(booking_id)::INT AS "bookingCount"
            FROM booking_hours
            GROUP BY hour_val
            ORDER BY "bookingCount" DESC
            """, nativeQuery = true)
    List<PeakHourAggregate> findPeakBookingHours();

    @Query(value = """
            WITH booking_hours AS (
                SELECT
                    generate_series(
                        DATE_PART('hour', b.start_time)::INT,
                        CASE 
                            WHEN DATE_PART('minute', b.end_time) > 0 THEN DATE_PART('hour', b.end_time)::INT
                            ELSE DATE_PART('hour', b.end_time)::INT - 1
                        END
                    ) AS hour_val,
                    b.resource_id,
                    b.location_id
                FROM bookings b
                WHERE b.status = 'APPROVED'
            )
            SELECT
                COALESCE(r.name, l.building_name || COALESCE(' ' || l.room_number, '')) AS "itemName",
                COUNT(*)::INT AS "bookingCount"
            FROM booking_hours bh
            LEFT JOIN resources r ON r.resource_id = bh.resource_id
            LEFT JOIN locations l ON l.location_id = bh.location_id
            WHERE bh.hour_val = :hourOfDay
            GROUP BY COALESCE(r.name, l.building_name || COALESCE(' ' || l.room_number, ''))
            ORDER BY "bookingCount" DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<HourItemAggregate> findTopItemsForHour(@Param("hourOfDay") int hourOfDay, @Param("limit") int limit);

    interface HourItemAggregate {
        String getItemName();
        Integer getBookingCount();
    }

    interface PeakHourAggregate {
        Integer getHourOfDay();
        Integer getBookingCount();
    }
}