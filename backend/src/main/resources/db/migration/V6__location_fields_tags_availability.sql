-- Location capacity, type, status; weekly availability and tag map per location

ALTER TABLE locations
    ADD COLUMN IF NOT EXISTS capacity INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS type resource_type NOT NULL DEFAULT 'LECTURE_HALL',
    ADD COLUMN IF NOT EXISTS status resource_status NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE locations ALTER COLUMN capacity DROP DEFAULT;

CREATE TABLE IF NOT EXISTS location_availability (
    avail_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    CONSTRAINT ck_location_avail_time_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_location_avail_day ON location_availability (location_id, day_of_week);

CREATE TABLE IF NOT EXISTS location_tag_map (
    location_id UUID NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES resource_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (location_id, tag_id)
);
