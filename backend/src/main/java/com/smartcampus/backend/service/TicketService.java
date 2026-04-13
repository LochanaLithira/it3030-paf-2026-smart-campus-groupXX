package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.ticket.*;
import com.smartcampus.backend.exception.*;
import com.smartcampus.backend.mapper.TicketMapper;
import com.smartcampus.backend.model.*;
import com.smartcampus.backend.model.enums.NotificationType;
import com.smartcampus.backend.model.enums.TicketCategory;
import com.smartcampus.backend.model.enums.TicketPriority;
import com.smartcampus.backend.model.enums.TicketStatus;
import com.smartcampus.backend.repository.*;
import com.smartcampus.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.*;
import org.springframework.data.domain.PageRequest;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketStatusHistoryRepository statusHistoryRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TicketMapper ticketMapper;

    @Value("${app.upload.ticket-attachments-dir:uploads/tickets}")
    private String uploadBaseDir;

    private static final long MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    private static final int MAX_ATTACHMENTS = 3;
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    @Transactional(readOnly = true)
    public Page<TicketSummaryResponse> listTickets(
            TicketStatus status,
            TicketPriority priority,
            TicketCategory category,
            UUID resourceId,
            Pageable pageable
    ) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        boolean canViewAll = hasPermission(currentUser, "tickets.view_all");
        boolean canViewAssigned = hasPermission(currentUser, "tickets.view_assigned");

        UUID reporterId = null;
        UUID assignedTechId = null;

        if (!canViewAll) {
            if (canViewAssigned) {
                // Technician sees assigned tickets
                assignedTechId = currentUserId;
            } else {
                // Regular user sees only their own tickets
                reporterId = currentUserId;
            }
        }

        // Strip sort from pageable: the native query already sorts by priority DESC, created_at DESC.
        // If we pass a Pageable with sort, Spring Data JPA appends the Java field name (e.g. "createdAt")
        // directly to the SQL, which PostgreSQL rejects because the column is "created_at".
        Pageable unsortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        Page<Ticket> tickets = ticketRepository.findAllWithFilters(
                status  == null ? null : status.name(),
                priority == null ? null : priority.name(),
                category == null ? null : category.name(),
                resourceId, reporterId, assignedTechId, unsortedPageable
        );

        return tickets.map(ticketMapper::toTicketSummaryResponse);
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(UUID ticketId) {
        Ticket ticket = ticketRepository.findByIdWithDetails(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + ticketId));

        checkTicketAccess(ticket);

        return ticketMapper.toTicketResponse(ticket);
    }

    @Transactional
    public TicketResponse createTicket(TicketRequest request, List<MultipartFile> files) throws IOException {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User reporter = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Resource resource = resourceRepository.findById(request.resourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + request.resourceId()));

        Ticket ticket = Ticket.builder()
                .resource(resource)
                .reporter(reporter)
                .category(request.category())
                .description(request.description())
                .priority(request.priority())
                .status(TicketStatus.OPEN)
                .preferredContactEmail(request.preferredContactEmail())    // PDF requirement
                .preferredContactPhone(request.preferredContactPhone())    // PDF requirement
                .dueDate(request.dueDate())                                // optional due date
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);

        // Process optional file attachments uploaded with the create request
        if (files != null) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    uploadAttachment(savedTicket.getTicketId(), file);
                }
            }
        }

        // Notify all admins about new ticket
        notifyAdmins("New Ticket Created",
                String.format("Ticket #%s: %s - %s",
                    savedTicket.getTicketId().toString().substring(0, 8),
                    savedTicket.getCategory(),
                    savedTicket.getDescription().substring(0, Math.min(50, savedTicket.getDescription().length()))),
                NotificationType.TICKET_CREATED,
                savedTicket.getTicketId());

        log.info("Created ticket {} for resource {} by user {}", 
                savedTicket.getTicketId(), resource.getResourceId(), currentUserId);

        return ticketMapper.toTicketResponse(savedTicket);
    }

    @Transactional
    public TicketResponse assignTicket(UUID ticketId, TicketAssignRequest request) {
        Ticket ticket = findTicketOrThrow(ticketId);

        // Only admins can assign tickets
        checkPermission("tickets.assign");

        User technician = userRepository.findById(request.assignedTechId())
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found"));

        // Verify technician has appropriate role
        boolean isTechnician = technician.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole().getRoleName().equals("TECHNICIAN") || 
                               ur.getRole().getRoleName().equals("ADMIN"));

        if (!isTechnician) {
            throw new AppException("User is not a technician", HttpStatus.BAD_REQUEST);
        }

        TicketStatus oldStatus = ticket.getStatus();
        ticket.setAssignedTech(technician);
        ticket.setDueDate(request.dueDate());
        
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        Ticket savedTicket = ticketRepository.save(ticket);

        // Log status change if it changed
        if (oldStatus != savedTicket.getStatus()) {
            logStatusChange(savedTicket, oldStatus, savedTicket.getStatus(), 
                    "Assigned to " + technician.getFullName());
        }

        // Notify the assigned technician
        sendNotificationSafe(
                technician.getUserId(),
                "Ticket Assigned",
                String.format("You have been assigned ticket #%s: %s",
                    ticket.getTicketId().toString().substring(0, 8),
                    ticket.getDescription().substring(0, Math.min(50, ticket.getDescription().length()))),
                NotificationType.TICKET_ASSIGNED,
                ticket.getTicketId()
        );

        log.info("Assigned ticket {} to technician {}", ticketId, technician.getUserId());

        return ticketMapper.toTicketResponse(savedTicket);
    }

    @Transactional
    public TicketResponse updateStatus(UUID ticketId, TicketStatusUpdateRequest request) {
        Ticket ticket = findTicketOrThrow(ticketId);
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        // Validate transition
        validateStatusTransition(ticket, request.newStatus(), currentUserId);

        TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(request.newStatus());

        if (request.resolutionNotes() != null && !request.resolutionNotes().isBlank()) {
            ticket.setResolutionNotes(request.resolutionNotes());
        }

        if (request.newStatus() == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(Instant.now());
        }

        Ticket savedTicket = ticketRepository.save(ticket);

        // Log status change
        logStatusChange(savedTicket, oldStatus, request.newStatus(), request.note());

        // Notify reporter about status change
        String statusMessage = switch (request.newStatus()) {
            case RESOLVED -> "Your ticket has been resolved: " + 
                    (request.resolutionNotes() != null ? request.resolutionNotes() : "Issue fixed");
            case CLOSED -> "Your ticket has been closed";
            case REJECTED -> "Your ticket has been rejected";
            case IN_PROGRESS -> "Your ticket is now in progress";
            default -> "Your ticket status has been updated to " + request.newStatus();
        };

        // Notify reporter about status change
        sendNotificationSafe(
                ticket.getReporter().getUserId(),
                "Ticket Status Updated",
                statusMessage,
                NotificationType.TICKET_UPDATED,
                ticket.getTicketId()
        );

        log.info("Updated ticket {} status from {} to {}", ticketId, oldStatus, request.newStatus());

        return ticketMapper.toTicketResponse(savedTicket);
    }

    @Transactional
    public TicketCommentResponse addComment(UUID ticketId, TicketCommentRequest request) {
        Ticket ticket = findTicketOrThrow(ticketId);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        
        checkTicketAccess(ticket);

        User author = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(author)
                .content(request.content())
                .build();

        TicketComment savedComment = commentRepository.save(comment);

        // Notify the other party
        UUID recipientId;
        if (currentUserId.equals(ticket.getReporter().getUserId())) {
            // Reporter commented, notify technician
            recipientId = ticket.getAssignedTech() != null ? ticket.getAssignedTech().getUserId() : null;
        } else {
            // Technician or admin commented, notify reporter
            recipientId = ticket.getReporter().getUserId();
        }

        // Notify other party about comment
        if (recipientId != null) {
            sendNotificationSafe(
                    recipientId,
                    "New Comment on Ticket",
                    String.format("%s commented: %s", author.getFullName(),
                        request.content().substring(0, Math.min(50, request.content().length()))),
                    NotificationType.TICKET_UPDATED,
                    ticket.getTicketId()
            );
        }

        log.info("Added comment to ticket {} by user {}", ticketId, currentUserId);

        return ticketMapper.toCommentResponse(savedComment);
    }

    @Transactional
    public TicketCommentResponse updateComment(UUID commentId, TicketCommentRequest request) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!comment.getAuthor().getUserId().equals(currentUserId)) {
            throw new ForbiddenException("You can only edit your own comments");
        }

        comment.setContent(request.content());
        TicketComment savedComment = commentRepository.save(comment);

        log.info("Updated comment {} by user {}", commentId, currentUserId);

        return ticketMapper.toCommentResponse(savedComment);
    }

    @Transactional
    public void deleteComment(UUID commentId) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAuthor = comment.getAuthor().getUserId().equals(currentUserId);
        boolean isAdmin = hasPermission(currentUser, "tickets.view_all"); // admins can moderate any comment

        if (!isAuthor && !isAdmin) {
            throw new ForbiddenException("You can only delete your own comments");
        }

        commentRepository.delete(comment);

        log.info("Deleted comment {} by user {}", commentId, currentUserId);
    }

    @Transactional
    public TicketAttachmentResponse uploadAttachment(UUID ticketId, MultipartFile file) throws IOException {
        Ticket ticket = findTicketOrThrow(ticketId);
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        // Only reporter can upload attachments
        if (!ticket.getReporter().getUserId().equals(currentUserId)) {
            throw new ForbiddenException("Only the ticket reporter can upload attachments");
        }

        // Cannot upload to resolved or closed tickets
        if (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED) {
            throw new AppException("Cannot upload attachments to resolved or closed tickets", HttpStatus.BAD_REQUEST);
        }

        // Check attachment count
        long currentCount = attachmentRepository.countByTicket_TicketId(ticketId);
        if (currentCount >= MAX_ATTACHMENTS) {
            throw new AppException("Maximum " + MAX_ATTACHMENTS + " attachments allowed per ticket", HttpStatus.BAD_REQUEST);
        }

        // Validate file
        validateFile(file);

        // Store file
        Path ticketDir = Path.of(uploadBaseDir, ticketId.toString());
        Files.createDirectories(ticketDir);

        String originalFilename = file.getOriginalFilename();
        String uniqueFilename = UUID.randomUUID() + "_" + originalFilename;
        Path filePath = ticketDir.resolve(uniqueFilename);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Create attachment record
        User uploader = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TicketAttachment attachment = TicketAttachment.builder()
                .ticket(ticket)
                .fileUrl("/api/v1/files/tickets/" + ticketId + "/" + uniqueFilename)
                .fileName(originalFilename)
                .fileSize((int) file.getSize())
                .uploadedBy(uploader)
                .build();

        TicketAttachment savedAttachment = attachmentRepository.save(attachment);

        log.info("Uploaded attachment {} to ticket {} by user {}", uniqueFilename, ticketId, currentUserId);

        return ticketMapper.toAttachmentResponse(savedAttachment);
    }

    @Transactional
    public void deleteAttachment(UUID attachmentId) {
        TicketAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        
        // Only uploader can delete
        if (!attachment.getUploadedBy().getUserId().equals(currentUserId)) {
            throw new ForbiddenException("You can only delete your own attachments");
        }

        // Cannot delete from resolved/closed tickets
        if (attachment.getTicket().getStatus() == TicketStatus.RESOLVED || 
            attachment.getTicket().getStatus() == TicketStatus.CLOSED) {
            throw new AppException("Cannot delete attachments from resolved or closed tickets", HttpStatus.BAD_REQUEST);
        }

        // Delete file from filesystem
        try {
            String fileUrl = attachment.getFileUrl();
            String filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
            Path filePath = Path.of(uploadBaseDir, attachment.getTicket().getTicketId().toString(), filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.error("Error deleting file for attachment {}", attachmentId, e);
        }

        attachmentRepository.delete(attachment);

        log.info("Deleted attachment {} by user {}", attachmentId, currentUserId);
    }

    @Transactional
    public void deleteTicket(UUID ticketId) {
        Ticket ticket = findTicketOrThrow(ticketId);

        if (ticket.getStatus() != TicketStatus.OPEN && ticket.getStatus() != TicketStatus.REJECTED) {
            throw new AppException("Only OPEN or REJECTED tickets can be deleted", HttpStatus.BAD_REQUEST);
        }

        ticketRepository.delete(ticket);
        log.info("Deleted ticket {} in status {}", ticketId, ticket.getStatus());
    }

    // Helper methods

    private Ticket findTicketOrThrow(UUID ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + ticketId));
    }

    private void checkTicketAccess(Ticket ticket) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        boolean canViewAll = hasPermission(currentUser, "tickets.view_all");
        boolean isReporter = ticket.getReporter().getUserId().equals(currentUserId);
        boolean isAssignedTech = ticket.getAssignedTech() != null && 
                                 ticket.getAssignedTech().getUserId().equals(currentUserId);

        if (!canViewAll && !isReporter && !isAssignedTech) {
            throw new ForbiddenException("You do not have access to this ticket");
        }
    }

    private void validateStatusTransition(Ticket ticket, TicketStatus newStatus, UUID userId) {
        TicketStatus currentStatus = ticket.getStatus();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = hasPermission(user, "tickets.close");
        boolean isTech = hasPermission(user, "tickets.update_status");

        // Admin can reject from OPEN only
        if (newStatus == TicketStatus.REJECTED) {
            if (!isAdmin) {
                throw new ForbiddenException("Only admins can reject tickets");
            }
            if (currentStatus != TicketStatus.OPEN) {
                throw new AppException("Can only reject tickets that are OPEN", HttpStatus.BAD_REQUEST);
            }
            return;
        }

        // Validate state machine transitions
        boolean isValidTransition = switch (currentStatus) {
            case OPEN -> newStatus == TicketStatus.IN_PROGRESS || newStatus == TicketStatus.REJECTED || newStatus == TicketStatus.CLOSED;
            case IN_PROGRESS -> newStatus == TicketStatus.RESOLVED || newStatus == TicketStatus.CLOSED;
            case RESOLVED -> newStatus == TicketStatus.CLOSED || newStatus == TicketStatus.IN_PROGRESS;
            case CLOSED, REJECTED -> false; // Terminal states
        };

        if (!isValidTransition) {
            throw new AppException(
                String.format("Invalid status transition from %s to %s", currentStatus, newStatus),
                HttpStatus.BAD_REQUEST
            );
        }

        // Permission checks
        if (newStatus == TicketStatus.CLOSED && !isAdmin) {
            throw new ForbiddenException("Only admins can close tickets");
        }

        if (newStatus == TicketStatus.RESOLVED && !isTech && !isAdmin) {
            throw new ForbiddenException("Only technicians or admins can resolve tickets");
        }
    }

    private void logStatusChange(Ticket ticket, TicketStatus oldStatus, TicketStatus newStatus, String note) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User changedBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TicketStatusHistory history = TicketStatusHistory.builder()
                .ticket(ticket)
                .changedBy(changedBy)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .note(note)
                .build();

        statusHistoryRepository.save(history);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new AppException("File is empty", HttpStatus.BAD_REQUEST);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException("File size exceeds maximum of 3MB", HttpStatus.BAD_REQUEST);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new AppException("Only image files (JPEG, PNG, GIF, WebP) are allowed", HttpStatus.BAD_REQUEST);
        }
    }

    private boolean hasPermission(User user, String permission) {
        return user.getUserRoles().stream()
                .flatMap(ur -> ur.getRole().getPermissions().stream())
                .anyMatch(p -> p.equals(permission));
    }

    private void checkPermission(String permission) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!hasPermission(user, permission)) {
            throw new ForbiddenException("You do not have permission: " + permission);
        }
    }

    private void notifyAdmins(String title, String message, NotificationType type, UUID relatedEntityId) {
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> hasPermission(u, "tickets.view_all"))
                .toList();

        for (User admin : admins) {
            sendNotificationSafe(admin.getUserId(), title, message, type, relatedEntityId);
        }
    }

    /**
     * Send a notification, swallowing any exception so notification failures
     * never roll back the parent ticket transaction.
     */
    private void sendNotificationSafe(UUID userId, String title, String message,
                                      NotificationType type, UUID relatedEntityId) {
        try {
            notificationService.create(userId, title, message, type, relatedEntityId);
        } catch (Exception ex) {
            log.warn("Failed to send {} notification to user {}: {}", type, userId, ex.getMessage());
        }
    }
}
