package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, UUID> {

    /**
     * Find all comments for a ticket, ordered chronologically.
     */
    @Query("""
        SELECT c FROM TicketComment c
        LEFT JOIN FETCH c.author
        WHERE c.ticket.ticketId = :ticketId
        ORDER BY c.createdAt ASC
    """)
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(@Param("ticketId") UUID ticketId);

    /**
     * Count comments for a ticket.
     */
    long countByTicket_TicketId(UUID ticketId);

    /**
     * Check if a comment belongs to a specific author.
     */
    @Query("SELECT COUNT(c) > 0 FROM TicketComment c WHERE c.commentId = :commentId AND c.author.userId = :userId")
    boolean isAuthoredBy(@Param("commentId") UUID commentId, @Param("userId") UUID userId);
}
