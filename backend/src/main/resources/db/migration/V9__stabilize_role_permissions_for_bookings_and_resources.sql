-- ================================================================
--  Flyway V7 — Stabilize core role permissions for mixed environments
--  Purpose: ensure booking + resource read paths work even when
--  legacy role permission sets were previously seeded.
-- ================================================================

-- ADMIN must be able to manage booking approvals and resources/locations.
UPDATE roles
SET permissions = ARRAY(
    SELECT DISTINCT p
    FROM unnest(
        permissions || ARRAY[
            'locations.read',
            'resources.read',
            'bookings.create',
            'bookings.view_own',
            'bookings.cancel_own',
            'bookings.view_all',
            'bookings.approve',
            'bookings.cancel_any'
        ]
    ) AS p
)
WHERE role_name = 'ADMIN';

-- USER must be able to discover resources and create/manage own bookings.
UPDATE roles
SET permissions = ARRAY(
    SELECT DISTINCT p
    FROM unnest(
        permissions || ARRAY[
            'locations.read',
            'resources.read',
            'bookings.create',
            'bookings.view_own',
            'bookings.cancel_own'
        ]
    ) AS p
)
WHERE role_name = 'USER';

-- TECHNICIAN should retain resource read and own booking visibility.
UPDATE roles
SET permissions = ARRAY(
    SELECT DISTINCT p
    FROM unnest(
        permissions || ARRAY[
            'locations.read',
            'resources.read',
            'bookings.view_own'
        ]
    ) AS p
)
WHERE role_name = 'TECHNICIAN';

