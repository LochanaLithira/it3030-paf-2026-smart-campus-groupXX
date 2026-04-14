-- ================================================================
--  Flyway V10 — Remove legacy resource columns
--  Drops fields no longer used by API/domain model:
--   - capacity
--   - location_id
--   - description
--   - image_url
-- ================================================================

-- Index depends on location_id; drop safely before column removal.
DROP INDEX IF EXISTS idx_resources_location;

ALTER TABLE resources
    DROP COLUMN IF EXISTS capacity,
    DROP COLUMN IF EXISTS location_id,
    DROP COLUMN IF EXISTS description,
    DROP COLUMN IF EXISTS image_url;
