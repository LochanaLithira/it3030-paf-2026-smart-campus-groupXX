-- ================================================================
-- Flyway V12 — Normalize notifications schema for preferences-aware module
-- ================================================================

-- 1) Remove rows that use legacy enum values before enum replacement.
DELETE FROM notifications
WHERE type IN ('BOOKING_CREATED', 'TICKET_UPDATED', 'MAINTENANCE_ALERT', 'SYSTEM', 'ROLE_CHANGE');

-- 2) Replace notification_type enum with the required value set.
CREATE TYPE notification_type_new AS ENUM (
    'BOOKING_APPROVED',
    'BOOKING_REJECTED',
    'BOOKING_CANCELLED',
    'TICKET_CREATED',
    'TICKET_STATUS_CHANGED',
    'TICKET_ASSIGNED',
    'TICKET_RESOLVED',
    'TICKET_REJECTED',
    'COMMENT_ADDED',
    'GENERAL'
);

ALTER TABLE notifications
ALTER COLUMN type TYPE notification_type_new
USING type::text::notification_type_new;

DROP TYPE notification_type;
ALTER TYPE notification_type_new RENAME TO notification_type;

-- 3) Add category enum and category column.
CREATE TYPE notification_category AS ENUM (
    'BOOKING',
    'TICKET',
    'COMMENT',
    'SYSTEM'
);

ALTER TABLE notifications
    ADD COLUMN category notification_category,
    ADD COLUMN reference_id VARCHAR(255),
    ADD COLUMN reference_type VARCHAR(50);

-- 4) Move existing linkage data to the new reference field and normalize type naming.
UPDATE notifications
SET reference_id = related_entity_id::text
WHERE related_entity_id IS NOT NULL;

UPDATE notifications
SET type = 'TICKET_STATUS_CHANGED'
WHERE type::text = 'TICKET_UPDATED';

UPDATE notifications
SET type = 'GENERAL'
WHERE type::text = 'SYSTEM';

UPDATE notifications
SET category = CASE
    WHEN type IN ('BOOKING_APPROVED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED') THEN 'BOOKING'::notification_category
    WHEN type IN ('TICKET_CREATED', 'TICKET_STATUS_CHANGED', 'TICKET_ASSIGNED', 'TICKET_RESOLVED', 'TICKET_REJECTED') THEN 'TICKET'::notification_category
    WHEN type = 'COMMENT_ADDED' THEN 'COMMENT'::notification_category
    WHEN type = 'GENERAL' THEN 'SYSTEM'::notification_category
    ELSE 'SYSTEM'::notification_category
END;

-- 5) Enforce requested title limit and required columns.
UPDATE notifications
SET title = LEFT(title, 120)
WHERE LENGTH(title) > 120;

ALTER TABLE notifications
    ALTER COLUMN title TYPE VARCHAR(120),
    ALTER COLUMN category SET NOT NULL;

-- 6) Drop old linkage column now that reference_id is populated.
ALTER TABLE notifications
    DROP COLUMN related_entity_id;

-- 7) Rebuild indexes for query patterns used by API/UI.
DROP INDEX IF EXISTS idx_notif_recipient;
DROP INDEX IF EXISTS idx_notif_created;

CREATE INDEX idx_notifications_user
    ON notifications (recipient_id);

CREATE INDEX idx_notifications_unread
    ON notifications (recipient_id, is_read);

CREATE INDEX idx_notifications_created
    ON notifications (recipient_id, created_at DESC);
