-- V5: Update role permissions to granular permissions
-- This migration replaces coarse-grained permissions with granular ones

-- Update ADMIN role with granular permissions
UPDATE roles SET permissions = ARRAY[
    -- User Management (Granular)
    'USERS_READ', 'USERS_CREATE', 'USERS_UPDATE', 'USERS_DELETE_SOFT', 'USERS_MANAGE_ROLES',
    -- Role Management (Granular)
    'ROLES_READ', 'ROLES_CREATE', 'ROLES_UPDATE', 'ROLES_DELETE',
    -- Resource Management (Granular)
    'LOCATIONS_READ', 'LOCATIONS_CREATE', 'LOCATIONS_UPDATE', 'LOCATIONS_DELETE',
    'RESOURCES_READ', 'RESOURCES_CREATE', 'RESOURCES_UPDATE', 'RESOURCES_UPDATE_STATUS', 'RESOURCES_DELETE',
    -- Booking Management
    'CREATE_BOOKING', 'VIEW_OWN_BOOKINGS', 'CANCEL_OWN_BOOKING',
    'VIEW_ALL_BOOKINGS', 'APPROVE_BOOKINGS', 'REJECT_BOOKINGS', 'CANCEL_ANY_BOOKING',
    -- Ticket Management
    'CREATE_TICKET', 'VIEW_OWN_TICKETS', 'COMMENT_ON_OWN_TICKET',
    'VIEW_ALL_TICKETS', 'ASSIGN_TICKETS', 'CLOSE_TICKETS',
    -- System
    'VIEW_REPORTS', 'VIEW_NOTIFICATIONS', 'MANAGE_NOTIFICATIONS', 'SYSTEM_SETTINGS'
]
WHERE role_name = 'ADMIN';

-- Update USER role with granular permissions
UPDATE roles SET permissions = ARRAY[
    'LOCATIONS_READ',
    'RESOURCES_READ',
    'CREATE_BOOKING',
    'VIEW_OWN_BOOKINGS',
    'CANCEL_OWN_BOOKING',
    'CREATE_TICKET',
    'VIEW_OWN_TICKETS',
    'COMMENT_ON_OWN_TICKET',
    'VIEW_NOTIFICATIONS'
]
WHERE role_name = 'USER';

-- Update TECHNICIAN role with granular permissions
UPDATE roles SET permissions = ARRAY[
    'RESOURCES_READ',
    'VIEW_ASSIGNED_TICKETS',
    'UPDATE_TICKET_STATUS',
    'ADD_RESOLUTION_NOTES',
    'COMMENT_ON_ASSIGNED_TICKET',
    'VIEW_NOTIFICATIONS',
    'CREATE_TICKET'
]
WHERE role_name = 'TECHNICIAN';
