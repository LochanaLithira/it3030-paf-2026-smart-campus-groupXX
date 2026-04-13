-- ================================================================
--  SMART CAMPUS RESOURCE MANAGEMENT PLATFORM
--  Flyway V4 — Add Maintenance & Ticketing Permissions (Module C)
--  Date: 2026-04-09
-- ================================================================

-- ADMIN: gets all ticket permissions (view all, assign, close, delete, update status, comment on any)
UPDATE roles
SET permissions = ARRAY(
    SELECT DISTINCT p
    FROM unnest(
        permissions || ARRAY[
            'tickets.view_all',
            'tickets.assign',
            'tickets.close',
            'tickets.delete',
            'tickets.update_status',
            'tickets.comment_own',
            'tickets.comment_assigned'
        ]
    ) AS p
)
WHERE role_name = 'ADMIN';

-- USER: create tickets + view own + comment on own
UPDATE roles
SET permissions = ARRAY(
    SELECT DISTINCT p
    FROM unnest(
        permissions || ARRAY[
            'tickets.create',
            'tickets.view_own',
            'tickets.comment_own'
        ]
    ) AS p
)
WHERE role_name = 'USER';

-- TECHNICIAN: view assigned tickets + update status + comment on assigned
UPDATE roles
SET permissions = ARRAY(
    SELECT DISTINCT p
    FROM unnest(
        permissions || ARRAY[
            'tickets.view_assigned',
            'tickets.update_status',
            'tickets.comment_assigned'
        ]
    ) AS p
)
WHERE role_name = 'TECHNICIAN';
