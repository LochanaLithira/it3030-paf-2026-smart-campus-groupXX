package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.notification.NotificationPageResponse;
import com.smartcampus.backend.dto.notification.UnreadCountResponse;
import com.smartcampus.backend.security.SecurityUtils;
import com.smartcampus.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Notifications", description = "In-app notification management")
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "List notifications for the current user")
    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_NOTIFICATIONS')")
    public ResponseEntity<NotificationPageResponse> listNotifications(
            @RequestParam(required = false) Boolean isRead,
            @PageableDefault(size = 20) Pageable pageable) {

        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(notificationService.listForUser(userId, isRead, pageable));
    }

    @Operation(summary = "Get unread notification count")
    @GetMapping("/unread-count")
    @PreAuthorize("hasAuthority('VIEW_NOTIFICATIONS')")
    public ResponseEntity<UnreadCountResponse> getUnreadCount() {
        UUID userId = SecurityUtils.getCurrentUserId();
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    @Operation(summary = "Mark a single notification as read")
    @PatchMapping("/{notificationId}/read")
    @PreAuthorize("hasAuthority('VIEW_NOTIFICATIONS')")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID notificationId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        notificationService.markAsRead(notificationId, userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Mark all notifications as read for the current user")
    @PatchMapping("/read-all")
    @PreAuthorize("hasAuthority('VIEW_NOTIFICATIONS')")
    public ResponseEntity<Void> markAllAsRead() {
        UUID userId = SecurityUtils.getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }
}
