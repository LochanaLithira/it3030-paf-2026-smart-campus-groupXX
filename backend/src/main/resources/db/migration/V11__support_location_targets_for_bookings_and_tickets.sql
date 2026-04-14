-- ================================================================
--  Flyway V11 — Allow bookings/tickets to target a location
--  Adds location_id and makes resource_id nullable with XOR checks.
-- ================================================================

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(location_id) ON DELETE CASCADE;

ALTER TABLE bookings
    ALTER COLUMN resource_id DROP NOT NULL;

ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS ck_booking_target_one_of;

ALTER TABLE bookings
    ADD CONSTRAINT ck_booking_target_one_of
        CHECK (
            (resource_id IS NOT NULL AND location_id IS NULL)
            OR (resource_id IS NULL AND location_id IS NOT NULL)
        );

ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS excl_no_double_booking_location;

ALTER TABLE bookings
    ADD CONSTRAINT excl_no_double_booking_location
        EXCLUDE USING gist (
            location_id WITH =,
            booking_date WITH =,
            tsrange(
                (booking_date + start_time)::timestamp,
                (booking_date + end_time)::timestamp
            ) WITH &&
        ) WHERE (status = 'APPROVED' AND location_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_bookings_location ON bookings (location_id, booking_date);

ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(location_id) ON DELETE CASCADE;

ALTER TABLE tickets
    ALTER COLUMN resource_id DROP NOT NULL;

ALTER TABLE tickets
    DROP CONSTRAINT IF EXISTS ck_ticket_target_one_of;

ALTER TABLE tickets
    ADD CONSTRAINT ck_ticket_target_one_of
        CHECK (
            (resource_id IS NOT NULL AND location_id IS NULL)
            OR (resource_id IS NULL AND location_id IS NOT NULL)
        );

CREATE INDEX IF NOT EXISTS idx_tickets_location ON tickets (location_id);
