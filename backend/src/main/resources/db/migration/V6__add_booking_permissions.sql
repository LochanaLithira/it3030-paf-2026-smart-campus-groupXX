-- ================================================================
--  Flyway V6 — Add Booking Management Permissions (Module B)
--  Date: 2026-04-13
-- ================================================================

-- ADMIN: view all bookings, approve/reject, cancel any booking
UPDATE roles
SET permissions = ARRAY(
    SELECT DISTINCT p
    FROM unnest(
        permissions || ARRAY[
            'bookings.view_all',
            'bookings.approve',
            'bookings.cancel_any'
        ]
    ) AS p
)
WHERE role_name = 'ADMIN';

-- USER: create bookings, view own, cancel own
UPDATE roles
SET permissions = ARRAY(
    SELECT DISTINCT p
    FROM unnest(
        permissions || ARRAY[
            'bookings.create',
            'bookings.view_own',
            'bookings.cancel_own'
        ]
    ) AS p
)
WHERE role_name = 'USER';

-- TECHNICIAN: view own bookings (useful for shared spaces), but cannot approve
UPDATE roles
SET permissions = ARRAY(
    SELECT DISTINCT p
    FROM unnest(
        permissions || ARRAY[
            'bookings.view_own'
        ]
    ) AS p
)
WHERE role_name = 'TECHNICIAN';

