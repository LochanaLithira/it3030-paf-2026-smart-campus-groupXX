package com.smartcampus.backend.model.enums;

public enum NotificationType {
    BOOKING_APPROVED(NotificationCategory.BOOKING),
    BOOKING_REJECTED(NotificationCategory.BOOKING),
    BOOKING_CANCELLED(NotificationCategory.BOOKING),
    TICKET_CREATED(NotificationCategory.TICKET),
    TICKET_STATUS_CHANGED(NotificationCategory.TICKET),
    TICKET_ASSIGNED(NotificationCategory.TICKET),
    TICKET_RESOLVED(NotificationCategory.TICKET),
    TICKET_REJECTED(NotificationCategory.TICKET),
    COMMENT_ADDED(NotificationCategory.COMMENT),
    GENERAL(NotificationCategory.SYSTEM);

    private final NotificationCategory category;

    NotificationType(NotificationCategory category) {
        this.category = category;
    }

    public NotificationCategory getCategory() {
        return category;
    }
}