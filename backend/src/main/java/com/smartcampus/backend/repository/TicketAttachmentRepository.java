package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, UUID> {

    /**
     * Count attachments for a specific ticket.
     */
    long countByTicket_TicketId(UUID ticketId);

    /**
     * Find all attachments for a ticket.
     */
    List<TicketAttachment> findByTicket_TicketIdOrderByUploadedAtAsc(UUID ticketId);

    /**
     * Check if an attachment belongs to a specific uploader.
     */
    @Query("SELECT COUNT(a) > 0 FROM TicketAttachment a WHERE a.attachmentId = :attachmentId AND a.uploadedBy.userId = :userId")
    boolean isUploadedBy(@Param("attachmentId") UUID attachmentId, @Param("userId") UUID userId);
}
