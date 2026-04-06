-- ================================================================
--  Flyway V3 — Add Facilities & Assets Permissions
-- ================================================================

UPDATE roles
SET permissions = ARRAY(
    SELECT DISTINCT p
    FROM unnest(
        permissions || ARRAY[
            'locations.read',
            'locations.create',
            'locations.update',
            'locations.delete',
            'resources.read',
            'resources.create',
            'resources.update',
            'resources.update_status',
            'resources.delete'
        ]
    ) AS p
)
WHERE role_name = 'ADMIN';

UPDATE roles
SET permissions = ARRAY(
    SELECT DISTINCT p
    FROM unnest(
        permissions || ARRAY[
            'locations.read',
            'resources.read'
        ]
    ) AS p
)
WHERE role_name IN ('USER', 'TECHNICIAN');
