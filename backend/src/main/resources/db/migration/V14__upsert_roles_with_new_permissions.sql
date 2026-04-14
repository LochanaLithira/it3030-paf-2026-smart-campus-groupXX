--  Flyway V14 — Update Existing Role Permissions
--  Purpose: Replace permission sets for existing roles:
--  ADMIN, USER, TECHNICIAN, and MANAGER.
-- ================================================================

UPDATE roles
SET permissions = ARRAY[
    'locations.read',
    'locations.create',
    'locations.update',
    'locations.delete',
    'resources.read',
    'resources.create',
    'resources.update',
    'resources.update_status',
    'resources.delete',
    'bookings.view_all',
    'bookings.approve',
    'bookings.cancel_any',
    'tickets.view_all',
    'tickets.assign',
    'tickets.update_status',
    'tickets.close',
    'tickets.delete',
    'tickets.comment_assigned',
    'pages.tickets_management_page_admin',
    'pages.bookings_management_page_admin',
    'pages.facilities_management_page',
    'pages.user_management_page',
    'pages.role_management_page'
]
WHERE role_name = 'MANAGER';

UPDATE roles
SET permissions = ARRAY[
    'tickets.view_assigned',
    'tickets.create',
    'tickets.update_status',
    'tickets.comment_assigned',
    'resources.read',
    'locations.read',
    'pages.tickets_management_page_admin',
    'pages.tickets_management_page_technician'
]
WHERE role_name = 'TECHNICIAN';

UPDATE roles
SET permissions = ARRAY[
    'pages.user_management_page',
    'pages.role_management_page',
    'pages.facilities_management_page',
    'pages.bookings_management_page_admin',
    'pages.tickets_management_page_user',
    'users.read',
    'users.create',
    'users.update',
    'users.delete_soft',
    'users.delete',
    'roles.read',
    'roles.create',
    'roles.update',
    'roles.delete',
    'users.manage_roles',
    'locations.read',
    'locations.create',
    'locations.update',
    'locations.delete',
    'resources.read',
    'resources.create',
    'resources.update',
    'resources.update_status',
    'resources.delete',
    'bookings.create',
    'bookings.view_own',
    'bookings.view_all',
    'bookings.approve',
    'bookings.cancel_own',
    'bookings.cancel_any',
    'tickets.create',
    'tickets.view_own',
    'tickets.view_all',
    'tickets.view_assigned',
    'tickets.assign',
    'tickets.update_status',
    'tickets.close',
    'tickets.delete',
    'tickets.comment_own',
    'tickets.comment_assigned'
]
WHERE role_name = 'ADMIN';

UPDATE roles
SET permissions = ARRAY[
    'bookings.create',
    'bookings.view_own',
    'bookings.cancel_own',
    'tickets.create',
    'tickets.view_own',
    'tickets.comment_own',
    'resources.read',
    'locations.read',
    'pages.bookings_management_page_user',
    'pages.tickets_management_page_user'
]
WHERE role_name = 'USER';
