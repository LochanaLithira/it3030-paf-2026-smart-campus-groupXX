package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.ticket.*;
import com.smartcampus.backend.model.enums.TicketCategory;
import com.smartcampus.backend.model.enums.TicketPriority;
import com.smartcampus.backend.model.enums.TicketStatus;
import com.smartcampus.backend.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "Maintenance and incident ticket management")
@SecurityRequirement(name = "bearerAuth")
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    @PreAuthorize("hasAuthority('tickets.view_own') or hasAuthority('tickets.view_all') or hasAuthority('tickets.view_assigned')")
    @Operation(summary = "List tickets", description = "List tickets with role-based filtering. Users see their own tickets, technicians see assigned tickets, admins see all.")
    public ResponseEntity<Page<TicketSummaryResponse>> listTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) TicketCategory category,
            @RequestParam(required = false) UUID resourceId,
            @RequestParam(required = false) UUID locationId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<TicketSummaryResponse> tickets = ticketService.listTickets(
            status, priority, category, resourceId, locationId, pageable
        );
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{ticketId}")
    @PreAuthorize("hasAuthority('tickets.view_own') or hasAuthority('tickets.view_all') or hasAuthority('tickets.view_assigned')")
    @Operation(summary = "Get ticket details", description = "Get full ticket details including attachments, comments, and status history")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable UUID ticketId) {
        TicketResponse ticket = ticketService.getTicketById(ticketId);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('tickets.create')")
    @Operation(summary = "Create ticket", description = "Create a new maintenance or incident ticket with optional file attachments")
    public ResponseEntity<TicketResponse> createTicket(
            @RequestPart("request") @Valid TicketRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) throws IOException {
        TicketResponse ticket = ticketService.createTicket(request, files);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @PatchMapping("/{ticketId}/assign")
    @PreAuthorize("hasAuthority('tickets.assign')")
    @Operation(summary = "Assign ticket to technician", description = "Assign a ticket to a technician (admin only)")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable UUID ticketId,
            @Valid @RequestBody TicketAssignRequest request
    ) {
        TicketResponse ticket = ticketService.assignTicket(ticketId, request);
        return ResponseEntity.ok(ticket);
    }

    @PatchMapping("/{ticketId}/status")
    @PreAuthorize("hasAuthority('tickets.update_status') or hasAuthority('tickets.close')")
    @Operation(summary = "Update ticket status", description = "Update ticket status with validation of state machine transitions")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable UUID ticketId,
            @Valid @RequestBody TicketStatusUpdateRequest request
    ) {
        TicketResponse ticket = ticketService.updateStatus(ticketId, request);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{ticketId}/comments")
    @PreAuthorize("hasAuthority('tickets.comment_own') or hasAuthority('tickets.comment_assigned')")
    @Operation(summary = "Add comment", description = "Add a comment to a ticket")
    public ResponseEntity<TicketCommentResponse> addComment(
            @PathVariable UUID ticketId,
            @Valid @RequestBody TicketCommentRequest request
    ) {
        TicketCommentResponse comment = ticketService.addComment(ticketId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @PutMapping("/{ticketId}/comments/{commentId}")
    @PreAuthorize("hasAuthority('tickets.comment_own') or hasAuthority('tickets.comment_assigned')")
    @Operation(summary = "Update comment", description = "Update your own comment")
    public ResponseEntity<TicketCommentResponse> updateComment(
            @PathVariable UUID ticketId,
            @PathVariable UUID commentId,
            @Valid @RequestBody TicketCommentRequest request
    ) {
        TicketCommentResponse comment = ticketService.updateComment(commentId, request);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    @PreAuthorize("hasAuthority('tickets.comment_own') or hasAuthority('tickets.comment_assigned')")
    @Operation(summary = "Delete comment", description = "Delete your own comment")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID ticketId,
            @PathVariable UUID commentId
    ) {
        ticketService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{ticketId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('tickets.create')")
    @Operation(summary = "Upload attachment", description = "Upload an image attachment (max 3 per ticket, max 3MB each)")
    public ResponseEntity<TicketAttachmentResponse> uploadAttachment(
            @PathVariable UUID ticketId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        TicketAttachmentResponse attachment = ticketService.uploadAttachment(ticketId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
    }

    @DeleteMapping("/{ticketId}/attachments/{attachmentId}")
    @PreAuthorize("hasAuthority('tickets.create')")
    @Operation(summary = "Delete attachment", description = "Delete your own attachment (only before ticket is resolved)")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable UUID ticketId,
            @PathVariable UUID attachmentId
    ) {
        ticketService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{ticketId}")
    @PreAuthorize("hasAuthority('tickets.delete')")
    @Operation(summary = "Delete ticket", description = "Delete a ticket (ADMIN only). Allowed only for OPEN or REJECTED tickets.")
    public ResponseEntity<Void> deleteTicket(@PathVariable UUID ticketId) {
        ticketService.deleteTicket(ticketId);
        return ResponseEntity.noContent().build();
    }
}
