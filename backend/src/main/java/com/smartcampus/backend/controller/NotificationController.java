package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.notification.BulkReadResponse;
import com.smartcampus.backend.dto.notification.NotificationDTO;
import com.smartcampus.backend.dto.notification.NotificationPreferenceDTO;
import com.smartcampus.backend.dto.notification.UpdatePreferenceRequest;
import com.smartcampus.backend.dto.notification.UnreadCountResponse;
import com.smartcampus.backend.model.enums.NotificationCategory;
import com.smartcampus.backend.security.SecurityUtils;
import com.smartcampus.backend.service.NotificationPreferenceService;
import com.smartcampus.backend.service.NotificationService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Notifications", description = "In-app notification management")
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationPreferenceService preferenceService;

    @Operation(summary = "List notifications for the current user")
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> listNotifications(
            @RequestParam(required = false, name = "read") Boolean read,
            @RequestParam(required = false, name = "category") NotificationCategory category) {

        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(notificationService.getNotificationsForUser(userId, read, category));
    }

    @Operation(summary = "Get unread notification count")
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount() {
        UUID userId = SecurityUtils.getCurrentUserId();
        int count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    @Operation(summary = "Mark a single notification as read")
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable UUID notificationId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(notificationService.markAsRead(notificationId, userId));
    }

    @Operation(summary = "Mark all notifications as read for the current user")
    @PatchMapping("/read-all")
    public ResponseEntity<BulkReadResponse> markAllAsRead() {
        UUID userId = SecurityUtils.getCurrentUserId();
        int updated = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(new BulkReadResponse(updated));
    }

    @Operation(summary = "Delete a single notification")
    @DeleteMapping("/{notificationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID notificationId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        notificationService.deleteNotification(notificationId, userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get notification preferences for the current user")
    @GetMapping("/preferences")
    public ResponseEntity<List<NotificationPreferenceDTO>> getPreferences() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(preferenceService.getPreferencesForUser(userId));
    }

    @Operation(summary = "Update notification preferences for the current user")
    @PutMapping("/preferences")
    public ResponseEntity<List<NotificationPreferenceDTO>> updatePreferences(
            @Valid @RequestBody List<UpdatePreferenceRequest> updates) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(preferenceService.updatePreferences(userId, updates));
    }
}