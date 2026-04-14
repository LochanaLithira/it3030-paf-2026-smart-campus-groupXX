package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.notification.NotificationDTO;
import com.smartcampus.backend.exception.ForbiddenException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.Notification;
import com.smartcampus.backend.model.Ticket;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.enums.NotificationCategory;
import com.smartcampus.backend.model.enums.NotificationType;
import com.smartcampus.backend.model.enums.TicketStatus;
import com.smartcampus.backend.repository.NotificationRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationPreferenceService preferenceService;

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    @Transactional
    public Notification sendNotification(UUID recipientUserId,
                                         NotificationType type,
                                         String title,
                                         String message,
                                         String referenceId,
                                         String referenceType) {
        if (!preferenceService.isNotificationEnabled(recipientUserId, type.getCategory())) {
            log.debug("Notification suppressed by preference for user {} and category {}", recipientUserId, type.getCategory());
            return null;
        }

        User recipient = userRepository.findById(recipientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", recipientUserId));

        Notification notification = Notification.builder()
                .recipient(recipient)
                .category(type.getCategory())
                .type(type)
                .title(title)
                .message(message)
                .isRead(false)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();

        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getNotificationsForUser(UUID userId, Boolean readFilter, NotificationCategory categoryFilter) {
        List<Notification> notifications;
        if (categoryFilter != null && readFilter != null) {
            notifications = notificationRepository.findByRecipientUserIdAndCategoryAndIsReadOrderByCreatedAtDesc(
                    userId, categoryFilter, readFilter
            );
        } else if (categoryFilter != null) {
            notifications = notificationRepository.findByRecipientUserIdAndCategoryOrderByCreatedAtDesc(userId, categoryFilter);
        } else if (readFilter != null) {
            notifications = notificationRepository.findByRecipientUserIdAndIsReadOrderByCreatedAtDesc(userId, readFilter);
        } else {
            notifications = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId);
        }

        return notifications.stream().map(this::toDto).toList();
    }

    @Transactional
    public NotificationDTO markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.getRecipient().getUserId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this notification");
        }

        notification.setRead(true);
        return toDto(notificationRepository.save(notification));
    }

    @Transactional
    public int markAllAsRead(UUID userId) {
        int updated = notificationRepository.markAllAsRead(userId);
        log.debug("Marked {} notifications as read for user {}", updated, userId);
        return updated;
    }

    @Transactional
    public void deleteNotification(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.getRecipient().getUserId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this notification");
        }

        notificationRepository.delete(notification);
    }

    @Transactional(readOnly = true)
    public int getUnreadCount(UUID userId) {
        return Math.toIntExact(notificationRepository.countByRecipientUserIdAndIsRead(userId, false));
    }

    @Transactional
    public void notifyBookingApproved(Booking booking) {
        String message = "Your booking for %s on %s %s-%s has been approved."
                .formatted(
                        bookingTargetName(booking),
                        booking.getBookingDate(),
                        booking.getStartTime().format(TIME_FORMAT),
                        booking.getEndTime().format(TIME_FORMAT)
                );
        sendNotification(
                booking.getUser().getUserId(),
                NotificationType.BOOKING_APPROVED,
                "Booking Approved",
                message,
                booking.getBookingId().toString(),
                "BOOKING"
        );
    }

    @Transactional
    public void notifyBookingRejected(Booking booking, String reason) {
        String message = "Your booking for %s on %s has been rejected. Reason: %s"
                .formatted(bookingTargetName(booking), booking.getBookingDate(), reason);
        sendNotification(
                booking.getUser().getUserId(),
                NotificationType.BOOKING_REJECTED,
                "Booking Rejected",
                message,
                booking.getBookingId().toString(),
                "BOOKING"
        );
    }

    @Transactional
    public void notifyBookingCancelled(Booking booking) {
        String message = "Your booking for %s on %s has been cancelled."
                .formatted(bookingTargetName(booking), booking.getBookingDate());
        sendNotification(
                booking.getUser().getUserId(),
                NotificationType.BOOKING_CANCELLED,
                "Booking Cancelled",
                message,
                booking.getBookingId().toString(),
                "BOOKING"
        );
    }

    @Transactional
    public void notifyTicketStatusChanged(Ticket ticket, TicketStatus newStatus) {
        String message = "Your ticket '%s' status changed to %s.".formatted(ticketTitle(ticket), newStatus);
        sendNotification(
                ticket.getReporter().getUserId(),
                NotificationType.TICKET_STATUS_CHANGED,
                "Ticket Status Updated",
                message,
                ticket.getTicketId().toString(),
                "TICKET"
        );
    }

    @Transactional
    public void notifyTechnicianAssigned(Ticket ticket, UUID technicianUserId) {
        String message = "You have been assigned ticket '%s' (Priority: %s)."
                .formatted(ticketTitle(ticket), ticket.getPriority());
        sendNotification(
                technicianUserId,
                NotificationType.TICKET_ASSIGNED,
                "New Ticket Assigned to You",
                message,
                ticket.getTicketId().toString(),
                "TICKET"
        );
    }

    @Transactional
    public void notifyTicketRejected(Ticket ticket, String reason) {
        String safeReason = (reason == null || reason.isBlank()) ? "No reason provided" : reason;
        String message = "Your ticket '%s' has been rejected. Reason: %s"
            .formatted(ticketTitle(ticket), safeReason);
        sendNotification(
                ticket.getReporter().getUserId(),
                NotificationType.TICKET_REJECTED,
                "Ticket Rejected",
                message,
                ticket.getTicketId().toString(),
                "TICKET"
        );
    }

    @Transactional
    public void notifyTicketResolved(Ticket ticket, String resolutionNotes) {
        String notes = (resolutionNotes == null || resolutionNotes.isBlank()) ? "No notes provided" : resolutionNotes;
        String message = "Your ticket '%s' has been resolved. Notes: %s"
                .formatted(ticketTitle(ticket), notes);
        sendNotification(
                ticket.getReporter().getUserId(),
                NotificationType.TICKET_RESOLVED,
                "Ticket Resolved",
                message,
                ticket.getTicketId().toString(),
                "TICKET"
        );
    }

    @Transactional
    public void notifyCommentAdded(Ticket ticket, UUID commenterUserId, String commentPreview) {
        Set<UUID> recipients = new LinkedHashSet<>();
        recipients.add(ticket.getReporter().getUserId());
        if (ticket.getAssignedTech() != null) {
            recipients.add(ticket.getAssignedTech().getUserId());
        }
        recipients.remove(commenterUserId);

        String truncated = truncateCommentPreview(commentPreview);
        String message = "A new comment was added to '%s': '%s'".formatted(ticketTitle(ticket), truncated);

        for (UUID recipient : recipients) {
            sendNotification(
                    recipient,
                    NotificationType.COMMENT_ADDED,
                    "New Comment on Your Ticket",
                    message,
                    ticket.getTicketId().toString(),
                    "COMMENT"
            );
        }
    }

    @Transactional
    public void cleanupNotifications(UUID userId, OffsetDateTime cutoff) {
        notificationRepository.deleteByRecipientUserIdAndCreatedAtBefore(userId, cutoff);
    }

    private NotificationDTO toDto(Notification n) {
        return new NotificationDTO(
                n.getNotificationId(),
                n.getRecipient().getUserId().toString(),
                n.getCategory(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.isRead(),
                n.getCreatedAt(),
                n.getReferenceId(),
                n.getReferenceType()
        );
    }

    private String bookingTargetName(Booking booking) {
        if (booking.getResource() != null) {
            return booking.getResource().getName();
        }
        if (booking.getLocation() != null) {
            return booking.getLocation().getBuildingName();
        }
        return "selected target";
    }

    private String ticketTitle(Ticket ticket) {
        String description = Objects.requireNonNullElse(ticket.getDescription(), "Ticket").trim();
        if (description.isBlank()) {
            return "Ticket";
        }
        return description.length() > 80 ? description.substring(0, 80) + "..." : description;
    }

    private String truncateCommentPreview(String preview) {
        String safe = Objects.requireNonNullElse(preview, "").trim();
        if (safe.isBlank()) {
            return "...";
        }
        return safe.length() > 80 ? safe.substring(0, 80) + "..." : safe;
    }
}