package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Notification;
import com.smartcampus.backend.model.enums.NotificationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(UUID recipientId);

    List<Notification> findByRecipientUserIdAndIsReadOrderByCreatedAtDesc(UUID recipientId, boolean isRead);

    List<Notification> findByRecipientUserIdAndCategoryOrderByCreatedAtDesc(UUID recipientId, NotificationCategory category);

    List<Notification> findByRecipientUserIdAndCategoryAndIsReadOrderByCreatedAtDesc(
        UUID recipientId,
        NotificationCategory category,
        boolean isRead
    );

    long countByRecipientUserIdAndIsRead(UUID recipientId, boolean isRead);

    void deleteByRecipientUserIdAndCreatedAtBefore(UUID userId, OffsetDateTime cutoff);

    Optional<Notification> findByNotificationIdAndRecipientUserId(UUID notificationId, UUID userId);

    int deleteByNotificationIdAndRecipientUserId(UUID notificationId, UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.notificationId = :id AND n.recipient.userId = :userId")
    int markAsRead(@Param("id") UUID notificationId, @Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient.userId = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") UUID userId);
}