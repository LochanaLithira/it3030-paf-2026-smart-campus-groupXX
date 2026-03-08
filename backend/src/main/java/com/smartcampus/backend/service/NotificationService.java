package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.notification.NotificationPageResponse;
import com.smartcampus.backend.dto.notification.NotificationResponse;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.Notification;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.enums.NotificationType;
import com.smartcampus.backend.repository.NotificationRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;

    // ─── Create (called internally by Booking/Ticket services) ───────────────

    @Transactional
    public Notification create(UUID recipientId,
                               String title,
                               String message,
                               NotificationType type,
                               UUID relatedEntityId) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User", recipientId));

        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .type(type)
                .relatedEntityId(relatedEntityId)
                .isRead(false)
                .build();

        return notificationRepository.save(notification);
    }

    // ─── Read ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public NotificationPageResponse listForUser(UUID userId, Boolean isRead, Pageable pageable) {
        Page<Notification> page = (isRead != null)
                ? notificationRepository.findByRecipientUserIdAndIsReadOrderByCreatedAtDesc(
                        userId, isRead, pageable)
                : notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId, pageable);

        long unreadCount = notificationRepository.countByRecipientUserIdAndIsRead(userId, false);

        return new NotificationPageResponse(
                page.getContent().stream().map(this::toResponse).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                unreadCount
        );
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByRecipientUserIdAndIsRead(userId, false);
    }

    // ─── Mark Read ───────────────────────────────────────────────────────────

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        int updated = notificationRepository.markAsRead(notificationId, userId);
        if (updated == 0) {
            // Either doesn't exist or belongs to another user
            throw new ResourceNotFoundException("Notification", notificationId);
        }
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsRead(userId);
        log.debug("Marked all notifications as read for user {}", userId);
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getNotificationId(),
                n.getTitle(),
                n.getMessage(),
                n.getType(),
                n.isRead(),
                n.getRelatedEntityId(),
                n.getCreatedAt()
        );
    }
}
