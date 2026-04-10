package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Ticket;
import com.smartcampus.backend.model.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    /**
     * Find ticket by ID with all associations eagerly loaded.
     */
    @Query("""
        SELECT DISTINCT t FROM Ticket t
        LEFT JOIN FETCH t.resource r
        LEFT JOIN FETCH r.location
        LEFT JOIN FETCH t.reporter rep
        LEFT JOIN FETCH t.assignedTech tech
        LEFT JOIN FETCH t.attachments
        LEFT JOIN FETCH t.comments c
        LEFT JOIN FETCH c.author
        LEFT JOIN FETCH t.statusHistory sh
        LEFT JOIN FETCH sh.changedBy
        WHERE t.ticketId = :ticketId
    """)
    Optional<Ticket> findByIdWithDetails(@Param("ticketId") UUID ticketId);

    /**
     * Find all tickets with filters and pagination.
     * Uses native SQL with explicit PostgreSQL enum casts to avoid Hibernate 6
     * generating 'cast(? as smallint)' for NAMED_ENUM typed columns.
     */
    @Query(
        value = """
            SELECT DISTINCT t.*,
                r.resource_id AS res_id,
                loc.location_id,
                rep.user_id AS rep_id,
                tech.user_id AS tech_id
            FROM tickets t
            LEFT JOIN resources r ON r.resource_id = t.resource_id
            LEFT JOIN locations loc ON loc.location_id = r.location_id
            LEFT JOIN users rep ON rep.user_id = t.reporter_id
            LEFT JOIN users tech ON tech.user_id = t.assigned_tech_id
            WHERE (:status IS NULL OR t.status = CAST(:status AS ticket_status))
            AND (:priority IS NULL OR t.priority = CAST(:priority AS ticket_priority))
            AND (CAST(:category AS VARCHAR) IS NULL OR t.category = :category)
            AND (:resourceId IS NULL OR r.resource_id = CAST(:resourceId AS uuid))
            AND (:reporterId IS NULL OR rep.user_id = CAST(:reporterId AS uuid))
            AND (:assignedTechId IS NULL OR tech.user_id = CAST(:assignedTechId AS uuid))
            ORDER BY t.priority DESC, t.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(DISTINCT t.ticket_id)
            FROM tickets t
            LEFT JOIN resources r ON r.resource_id = t.resource_id
            LEFT JOIN users rep ON rep.user_id = t.reporter_id
            LEFT JOIN users tech ON tech.user_id = t.assigned_tech_id
            WHERE (:status IS NULL OR t.status = CAST(:status AS ticket_status))
            AND (:priority IS NULL OR t.priority = CAST(:priority AS ticket_priority))
            AND (CAST(:category AS VARCHAR) IS NULL OR t.category = :category)
            AND (:resourceId IS NULL OR r.resource_id = CAST(:resourceId AS uuid))
            AND (:reporterId IS NULL OR rep.user_id = CAST(:reporterId AS uuid))
            AND (:assignedTechId IS NULL OR tech.user_id = CAST(:assignedTechId AS uuid))
            """,
        nativeQuery = true
    )
    Page<Ticket> findAllWithFilters(
        @Param("status") String status,
        @Param("priority") String priority,
        @Param("category") String category,
        @Param("resourceId") UUID resourceId,
        @Param("reporterId") UUID reporterId,
        @Param("assignedTechId") UUID assignedTechId,
        Pageable pageable
    );


    /**
     * Count tickets by reporter.
     */
    long countByReporter_UserId(UUID reporterId);

    /**
     * Count tickets by assigned technician.
     */
    long countByAssignedTech_UserId(UUID techId);

    /**
     * Count tickets by status.
     */
    long countByStatus(TicketStatus status);
}
