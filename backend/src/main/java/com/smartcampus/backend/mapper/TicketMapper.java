package com.smartcampus.backend.mapper;

import com.smartcampus.backend.dto.auth.UserSummaryResponse;
import com.smartcampus.backend.dto.ticket.*;
import com.smartcampus.backend.model.*;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TicketMapper {

    // User mappings
    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "fullName", source = "fullName")
    @Mapping(target = "email", source = "email")
    UserSummaryResponse toUserSummaryResponse(User user);

    // Resource response for tickets
    @Mapping(target = "resourceId", source = "resourceId")
    @Mapping(target = "name", source = "name")
    @Mapping(target = "type", source = "type")
    @Mapping(target = "location", source = "location")
    TicketResourceResponse toTicketResourceResponse(Resource resource);

    // Ticket full response with all associations
    @Mapping(target = "ticketId", source = "ticketId")
    @Mapping(target = "resource", source = "resource")
    @Mapping(target = "reporter", source = "reporter")
    @Mapping(target = "assignedTech", source = "assignedTech")
    @Mapping(target = "category", source = "category")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "priority", source = "priority")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "resolutionNotes", source = "resolutionNotes")
    @Mapping(target = "dueDate", source = "dueDate")
    @Mapping(target = "resolvedAt", source = "resolvedAt")
    @Mapping(target = "preferredContactEmail", source = "preferredContactEmail")  // PDF requirement
    @Mapping(target = "preferredContactPhone", source = "preferredContactPhone")  // PDF requirement
    @Mapping(target = "attachments", source = "attachments")
    @Mapping(target = "comments", source = "comments")
    @Mapping(target = "statusHistory", source = "statusHistory")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "updatedAt")
    TicketResponse toTicketResponse(Ticket ticket);

    // Ticket summary response (for list views)
    @Mapping(target = "ticketId", source = "ticket.ticketId")
    @Mapping(target = "resource", source = "ticket.resource")
    @Mapping(target = "reporter", source = "ticket.reporter")
    @Mapping(target = "assignedTech", source = "ticket.assignedTech")
    @Mapping(target = "category", source = "ticket.category")
    @Mapping(target = "description", source = "ticket.description")
    @Mapping(target = "priority", source = "ticket.priority")
    @Mapping(target = "status", source = "ticket.status")
    @Mapping(target = "preferredContactEmail", source = "ticket.preferredContactEmail")  // PDF requirement
    @Mapping(target = "preferredContactPhone", source = "ticket.preferredContactPhone")  // PDF requirement
    @Mapping(target = "attachmentCount", source = "attachmentCount")
    @Mapping(target = "commentCount", source = "commentCount")
    @Mapping(target = "dueDate", source = "ticket.dueDate")
    @Mapping(target = "createdAt", source = "ticket.createdAt")
    @Mapping(target = "updatedAt", source = "ticket.updatedAt")
    TicketSummaryResponse toTicketSummaryResponse(Ticket ticket, int attachmentCount, int commentCount);

    // Alternative: simple summary from ticket entity
    default TicketSummaryResponse toTicketSummaryResponse(Ticket ticket) {
        return toTicketSummaryResponse(
            ticket,
            ticket.getAttachments() != null ? ticket.getAttachments().size() : 0,
            ticket.getComments() != null ? ticket.getComments().size() : 0
        );
    }

    // Comment mappings
    @Mapping(target = "commentId", source = "commentId")
    @Mapping(target = "author", source = "author")
    @Mapping(target = "content", source = "content")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "updatedAt")
    TicketCommentResponse toCommentResponse(TicketComment comment);

    List<TicketCommentResponse> toCommentResponseList(List<TicketComment> comments);

    // Attachment mappings
    @Mapping(target = "attachmentId", source = "attachmentId")
    @Mapping(target = "fileUrl", source = "fileUrl")
    @Mapping(target = "fileName", source = "fileName")
    @Mapping(target = "fileSize", source = "fileSize")
    @Mapping(target = "uploadedBy", source = "uploadedBy")
    @Mapping(target = "uploadedAt", source = "uploadedAt")
    TicketAttachmentResponse toAttachmentResponse(TicketAttachment attachment);

    List<TicketAttachmentResponse> toAttachmentResponseList(List<TicketAttachment> attachments);

    // Status history mappings
    @Mapping(target = "historyId", source = "historyId")
    @Mapping(target = "changedBy", source = "changedBy")
    @Mapping(target = "oldStatus", source = "oldStatus")
    @Mapping(target = "newStatus", source = "newStatus")
    @Mapping(target = "note", source = "note")
    @Mapping(target = "changedAt", source = "changedAt")
    StatusHistoryResponse toStatusHistoryResponse(TicketStatusHistory history);

    List<StatusHistoryResponse> toStatusHistoryResponseList(List<TicketStatusHistory> historyList);
}
