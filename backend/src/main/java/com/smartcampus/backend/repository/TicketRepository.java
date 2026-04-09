package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Ticket;
import com.smartcampus.backend.model.enums.TicketCategory;
import com.smartcampus.backend.model.enums.TicketPriority;
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
     * JOIN FETCH optimized to avoid N+1 queries.
     */
    @Query("""
        SELECT DISTINCT t FROM Ticket t
        LEFT JOIN FETCH t.resource r
        LEFT JOIN FETCH r.location
        LEFT JOIN FETCH t.reporter rep
        LEFT JOIN FETCH t.assignedTech tech
        WHERE (:status IS NULL OR t.status = CAST(:status AS com.smartcampus.backend.model.enums.TicketStatus))
        AND (:priority IS NULL OR t.priority = CAST(:priority AS com.smartcampus.backend.model.enums.TicketPriority))
        AND (:category IS NULL OR t.category = CAST(:category AS com.smartcampus.backend.model.enums.TicketCategory))
        AND (:resourceId IS NULL OR t.resource.resourceId = :resourceId)
        AND (:reporterId IS NULL OR t.reporter.userId = :reporterId)
        AND (:assignedTechId IS NULL OR t.assignedTech.userId = :assignedTechId)
        ORDER BY t.priority DESC, t.createdAt DESC
    """)
    Page<Ticket> findAllWithFilters(
        @Param("status") TicketStatus status,
        @Param("priority") TicketPriority priority,
        @Param("category") TicketCategory category,
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
