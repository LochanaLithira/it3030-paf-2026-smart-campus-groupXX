DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_recurrence_type') THEN
        CREATE TYPE availability_recurrence_type AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
    END IF;
END $$;

ALTER TABLE resource_availability
    ADD COLUMN IF NOT EXISTS recurrence_type availability_recurrence_type NOT NULL DEFAULT 'WEEKLY',
    ADD COLUMN IF NOT EXISTS day_of_month INT;

ALTER TABLE resource_availability
    ALTER COLUMN day_of_week DROP NOT NULL;

ALTER TABLE resource_availability
    DROP CONSTRAINT IF EXISTS ck_resource_avail_recurrence_fields;

ALTER TABLE resource_availability
    ADD CONSTRAINT ck_resource_avail_recurrence_fields CHECK (
        (recurrence_type = 'DAILY' AND day_of_week IS NULL AND day_of_month IS NULL) OR
        (recurrence_type = 'WEEKLY' AND day_of_week IS NOT NULL AND day_of_month IS NULL) OR
        (recurrence_type = 'MONTHLY' AND day_of_week IS NULL AND day_of_month BETWEEN 1 AND 31)
    );

ALTER TABLE location_availability
    ADD COLUMN IF NOT EXISTS recurrence_type availability_recurrence_type NOT NULL DEFAULT 'WEEKLY',
    ADD COLUMN IF NOT EXISTS day_of_month INT;

ALTER TABLE location_availability
    ALTER COLUMN day_of_week DROP NOT NULL;

ALTER TABLE location_availability
    DROP CONSTRAINT IF EXISTS ck_location_avail_recurrence_fields;

ALTER TABLE location_availability
    ADD CONSTRAINT ck_location_avail_recurrence_fields CHECK (
        (recurrence_type = 'DAILY' AND day_of_week IS NULL AND day_of_month IS NULL) OR
        (recurrence_type = 'WEEKLY' AND day_of_week IS NOT NULL AND day_of_month IS NULL) OR
        (recurrence_type = 'MONTHLY' AND day_of_week IS NULL AND day_of_month BETWEEN 1 AND 31)
    );
