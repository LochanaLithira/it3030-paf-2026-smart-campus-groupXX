package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.TicketStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketStatusHistoryRepository extends JpaRepository<TicketStatusHistory, UUID> {

    /**
     * Find all status changes for a ticket, ordered from most recent to oldest.
     */
    @Query("""
        SELECT h FROM TicketStatusHistory h
        LEFT JOIN FETCH h.changedBy
        WHERE h.ticket.ticketId = :ticketId
        ORDER BY h.changedAt DESC
    """)
    List<TicketStatusHistory> findByTicketIdOrderByChangedAtDesc(@Param("ticketId") UUID ticketId);
}
