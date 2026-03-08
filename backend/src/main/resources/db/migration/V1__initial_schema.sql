-- ================================================================
--  SMART CAMPUS RESOURCE MANAGEMENT PLATFORM
--  Flyway V1 — Initial Schema
--  Database: PostgreSQL 16+
-- ================================================================

-- ======================== EXTENSIONS ========================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ======================== ENUM TYPES ========================

CREATE TYPE resource_type   AS ENUM ('LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT');
CREATE TYPE resource_status AS ENUM ('ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE');
CREATE TYPE day_of_week     AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');
CREATE TYPE booking_status  AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE ticket_status   AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');
CREATE TYPE notification_type AS ENUM (
    'BOOKING_CREATED', 'BOOKING_APPROVED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED',
    'TICKET_CREATED', 'TICKET_ASSIGNED', 'TICKET_UPDATED', 'TICKET_RESOLVED',
    'MAINTENANCE_ALERT', 'SYSTEM', 'ROLE_CHANGE'
);

-- ======================== HELPER FUNCTION ========================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ================================================================
-- 1. AUTHENTICATION & ROLES
-- ================================================================

CREATE TABLE IF NOT EXISTS users (
    user_id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email                 VARCHAR(150) UNIQUE NOT NULL,
    full_name             VARCHAR(100) NOT NULL,
    password_hash         TEXT,
    oauth_provider        VARCHAR(50),
    oauth_provider_id     VARCHAR(255),
    profile_picture_url   TEXT,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS roles (
    role_id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name   VARCHAR(50) UNIQUE NOT NULL,
    permissions TEXT[]      NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id     UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);


-- ================================================================
-- 2. FACILITIES & ASSETS
-- ================================================================

CREATE TABLE IF NOT EXISTS locations (
    location_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_name VARCHAR(100) NOT NULL,
    floor_number  INT NOT NULL,
    room_number   VARCHAR(20),
    description   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (building_name, floor_number, room_number)
);

CREATE TRIGGER trg_locations_updated
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS resources (
    resource_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(150) NOT NULL,
    type         resource_type NOT NULL,
    capacity     INT CHECK (capacity > 0),
    location_id  UUID REFERENCES locations(location_id) ON DELETE SET NULL,
    status       resource_status NOT NULL DEFAULT 'ACTIVE',
    description  TEXT,
    image_url    TEXT,
    created_by   UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_resources_updated
    BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS resource_availability (
    avail_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    CONSTRAINT ck_avail_time_order CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS resource_tags (
    tag_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS resource_tag_map (
    resource_id UUID NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES resource_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (resource_id, tag_id)
);


-- ================================================================
-- 3. BOOKING MANAGEMENT
-- ================================================================

CREATE TABLE IF NOT EXISTS bookings (
    booking_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id        UUID NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    user_id            UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    booking_date       DATE NOT NULL,
    start_time         TIME NOT NULL,
    end_time           TIME NOT NULL,
    purpose            TEXT NOT NULL,
    expected_attendees INT CHECK (expected_attendees > 0),
    status             booking_status NOT NULL DEFAULT 'PENDING',
    rejection_reason   VARCHAR(255),
    reviewed_by        UUID REFERENCES users(user_id) ON DELETE SET NULL,
    reviewed_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_booking_time_order CHECK (end_time > start_time),
    CONSTRAINT excl_no_double_booking
        EXCLUDE USING gist (
            resource_id WITH =,
            booking_date WITH =,
            tsrange(
                (booking_date + start_time)::timestamp,
                (booking_date + end_time)::timestamp
            ) WITH &&
        ) WHERE (status = 'APPROVED')
);

CREATE TRIGGER trg_bookings_updated
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS recurring_booking_groups (
    group_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    resource_id     UUID NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    recurrence_rule VARCHAR(255) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    purpose         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_recur_dates CHECK (end_date >= start_date),
    CONSTRAINT ck_recur_times CHECK (end_time > start_time)
);

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS recurring_group_id UUID
        REFERENCES recurring_booking_groups(group_id) ON DELETE SET NULL;


-- ================================================================
-- 4. MAINTENANCE & TICKETING
-- ================================================================

CREATE TABLE IF NOT EXISTS tickets (
    ticket_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id      UUID NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    reporter_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_tech_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    category         VARCHAR(100) NOT NULL,
    description      TEXT NOT NULL,
    priority         ticket_priority NOT NULL DEFAULT 'LOW',
    status           ticket_status NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT,
    due_date         DATE,
    resolved_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_tickets_updated
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS ticket_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id     UUID NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    file_url      TEXT NOT NULL,
    file_name     VARCHAR(255),
    file_size     INT,
    uploaded_by   UUID REFERENCES users(user_id) ON DELETE SET NULL,
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id  UUID NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    author_id  UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_ticket_comments_updated
    BEFORE UPDATE ON ticket_comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS ticket_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id  UUID NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    old_status ticket_status NOT NULL,
    new_status ticket_status NOT NULL,
    note       TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ================================================================
-- 5. NOTIFICATIONS
-- ================================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    message           TEXT NOT NULL,
    type              notification_type NOT NULL,
    is_read           BOOLEAN NOT NULL DEFAULT FALSE,
    related_entity_id UUID,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ================================================================
-- 6. INDEXES
-- ================================================================

CREATE INDEX idx_users_email           ON users (email);
CREATE INDEX idx_users_oauth_provider  ON users (oauth_provider, oauth_provider_id) WHERE oauth_provider IS NOT NULL;
CREATE INDEX idx_roles_permissions     ON roles USING GIN (permissions);
CREATE INDEX idx_resources_type        ON resources (type);
CREATE INDEX idx_resources_status      ON resources (status);
CREATE INDEX idx_resources_location    ON resources (location_id);
CREATE INDEX idx_resources_created_by  ON resources (created_by);
CREATE INDEX idx_avail_resource_day    ON resource_availability (resource_id, day_of_week);
CREATE INDEX idx_bookings_resource     ON bookings (resource_id, booking_date);
CREATE INDEX idx_bookings_user         ON bookings (user_id);
CREATE INDEX idx_bookings_status       ON bookings (status);
CREATE INDEX idx_bookings_date         ON bookings (booking_date);
CREATE INDEX idx_tickets_resource      ON tickets (resource_id);
CREATE INDEX idx_tickets_reporter      ON tickets (reporter_id);
CREATE INDEX idx_tickets_tech          ON tickets (assigned_tech_id) WHERE assigned_tech_id IS NOT NULL;
CREATE INDEX idx_tickets_status        ON tickets (status);
CREATE INDEX idx_tickets_priority      ON tickets (priority);
CREATE INDEX idx_tkt_attach_ticket     ON ticket_attachments (ticket_id);
CREATE INDEX idx_tkt_comment_ticket    ON ticket_comments (ticket_id);
CREATE INDEX idx_tkt_history_ticket    ON ticket_status_history (ticket_id);
CREATE INDEX idx_notif_recipient       ON notifications (recipient_id, is_read);
CREATE INDEX idx_notif_created         ON notifications (created_at DESC);


-- ================================================================
-- 7. SEED DATA
-- ================================================================

INSERT INTO roles (role_id, role_name, permissions) VALUES
    (gen_random_uuid(), 'ADMIN', ARRAY[
        'MANAGE_USERS', 'MANAGE_ROLES', 'MANAGE_RESOURCES', 'MANAGE_LOCATIONS',
        'VIEW_ALL_BOOKINGS', 'APPROVE_BOOKINGS', 'REJECT_BOOKINGS', 'CANCEL_ANY_BOOKING',
        'VIEW_ALL_TICKETS', 'ASSIGN_TICKETS', 'CLOSE_TICKETS',
        'VIEW_REPORTS', 'MANAGE_NOTIFICATIONS', 'SYSTEM_SETTINGS'
    ]),
    (gen_random_uuid(), 'USER', ARRAY[
        'VIEW_RESOURCES', 'CREATE_BOOKING', 'VIEW_OWN_BOOKINGS', 'CANCEL_OWN_BOOKING',
        'CREATE_TICKET', 'VIEW_OWN_TICKETS', 'COMMENT_ON_OWN_TICKET',
        'VIEW_NOTIFICATIONS'
    ]),
    (gen_random_uuid(), 'TECHNICIAN', ARRAY[
        'VIEW_RESOURCES', 'VIEW_ASSIGNED_TICKETS', 'UPDATE_TICKET_STATUS',
        'ADD_RESOLUTION_NOTES', 'COMMENT_ON_ASSIGNED_TICKET',
        'VIEW_NOTIFICATIONS', 'CREATE_TICKET'
    ])
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO resource_tags (tag_id, tag_name) VALUES
    (gen_random_uuid(), 'projector'),
    (gen_random_uuid(), 'whiteboard'),
    (gen_random_uuid(), 'air_conditioning'),
    (gen_random_uuid(), 'video_conferencing'),
    (gen_random_uuid(), 'computers'),
    (gen_random_uuid(), 'wheelchair_accessible')
ON CONFLICT (tag_name) DO NOTHING;
