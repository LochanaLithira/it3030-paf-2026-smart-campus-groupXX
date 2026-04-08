// ================================================================
//  Smart Campus — Permission Constants
//  Mirrors the backend roles.permissions text[] column values
// ================================================================

export const PERMISSIONS = {
  // User Management (Granular)
  USERS_READ: 'USERS_READ',
  USERS_CREATE: 'USERS_CREATE',
  USERS_UPDATE: 'USERS_UPDATE',
  USERS_DELETE_SOFT: 'USERS_DELETE_SOFT',
  USERS_MANAGE_ROLES: 'USERS_MANAGE_ROLES',
  
  // User Management (Coarse - Backend)
  MANAGE_USERS: 'MANAGE_USERS',
  
  // Role Management (Granular)
  ROLES_READ: 'ROLES_READ',
  ROLES_CREATE: 'ROLES_CREATE',
  ROLES_UPDATE: 'ROLES_UPDATE',
  ROLES_DELETE: 'ROLES_DELETE',
  
  // Role Management (Coarse - Backend)
  MANAGE_ROLES: 'MANAGE_ROLES',
  
  // Resource Management (Granular)
  LOCATIONS_READ: 'LOCATIONS_READ',
  LOCATIONS_CREATE: 'LOCATIONS_CREATE',
  LOCATIONS_UPDATE: 'LOCATIONS_UPDATE',
  LOCATIONS_DELETE: 'LOCATIONS_DELETE',
  
  RESOURCES_READ: 'RESOURCES_READ',
  RESOURCES_CREATE: 'RESOURCES_CREATE',
  RESOURCES_UPDATE: 'RESOURCES_UPDATE',
  RESOURCES_UPDATE_STATUS: 'RESOURCES_UPDATE_STATUS',
  RESOURCES_DELETE: 'RESOURCES_DELETE',
  
  // Resource Management (Coarse - Backend)
  MANAGE_RESOURCES: 'MANAGE_RESOURCES',
  MANAGE_LOCATIONS: 'MANAGE_LOCATIONS',
  VIEW_RESOURCES: 'VIEW_RESOURCES',
  
  // Booking Management
  VIEW_ALL_BOOKINGS: 'VIEW_ALL_BOOKINGS',
  APPROVE_BOOKINGS: 'APPROVE_BOOKINGS',
  REJECT_BOOKINGS: 'REJECT_BOOKINGS',
  CANCEL_ANY_BOOKING: 'CANCEL_ANY_BOOKING',
  CREATE_BOOKING: 'CREATE_BOOKING',
  VIEW_OWN_BOOKINGS: 'VIEW_OWN_BOOKINGS',
  CANCEL_OWN_BOOKING: 'CANCEL_OWN_BOOKING',
  
  // Ticket Management
  VIEW_ALL_TICKETS: 'VIEW_ALL_TICKETS',
  ASSIGN_TICKETS: 'ASSIGN_TICKETS',
  CLOSE_TICKETS: 'CLOSE_TICKETS',
  CREATE_TICKET: 'CREATE_TICKET',
  VIEW_OWN_TICKETS: 'VIEW_OWN_TICKETS',
  COMMENT_ON_OWN_TICKET: 'COMMENT_ON_OWN_TICKET',
  VIEW_ASSIGNED_TICKETS: 'VIEW_ASSIGNED_TICKETS',
  UPDATE_TICKET_STATUS: 'UPDATE_TICKET_STATUS',
  ADD_RESOLUTION_NOTES: 'ADD_RESOLUTION_NOTES',
  COMMENT_ON_ASSIGNED_TICKET: 'COMMENT_ON_ASSIGNED_TICKET',
  
  // Reports & Notifications
  VIEW_REPORTS: 'VIEW_REPORTS',
  VIEW_NOTIFICATIONS: 'VIEW_NOTIFICATIONS',
  MANAGE_NOTIFICATIONS: 'MANAGE_NOTIFICATIONS',
  
  // System
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ── Permission Groups (for UI rendering) ────────────────────────

export const PERMISSION_GROUPS = [
  {
    id: 'user-management',
    label: 'User Management',
    description: 'Manage user accounts and roles',
    permissions: [
      { key: PERMISSIONS.USERS_READ, label: 'View Users', description: 'View user details and profiles' },
      { key: PERMISSIONS.USERS_CREATE, label: 'Create Users', description: 'Create new user accounts' },
      { key: PERMISSIONS.USERS_UPDATE, label: 'Update Users', description: 'Edit user information' },
      { key: PERMISSIONS.USERS_DELETE_SOFT, label: 'Deactivate Users', description: 'Deactivate user accounts' },
      { key: PERMISSIONS.USERS_MANAGE_ROLES, label: 'Manage User Roles', description: 'Assign and modify user roles' },
    ],
  },
  {
    id: 'role-management',
    label: 'Role Management',
    description: 'Manage roles and permissions',
    permissions: [
      { key: PERMISSIONS.ROLES_READ, label: 'View Roles', description: 'View roles' },
      { key: PERMISSIONS.ROLES_CREATE, label: 'Create Roles', description: 'Create roles' },
      { key: PERMISSIONS.ROLES_UPDATE, label: 'Update Roles', description: 'Edit roles' },
      { key: PERMISSIONS.ROLES_DELETE, label: 'Delete Roles', description: 'Delete roles' },
    ],
  },
  {
    id: 'facilities-assets',
    label: 'Facilities & Assets',
    description: 'Manage campus locations and resources',
    permissions: [
      { key: PERMISSIONS.LOCATIONS_READ, label: 'View Locations', description: 'View campus locations' },
      { key: PERMISSIONS.LOCATIONS_CREATE, label: 'Create Locations', description: 'Create locations' },
      { key: PERMISSIONS.LOCATIONS_UPDATE, label: 'Update Locations', description: 'Edit locations' },
      { key: PERMISSIONS.LOCATIONS_DELETE, label: 'Delete Locations', description: 'Delete locations' },
      { key: PERMISSIONS.RESOURCES_READ, label: 'View Resources', description: 'View resources' },
      { key: PERMISSIONS.RESOURCES_CREATE, label: 'Create Resources', description: 'Create resources' },
      { key: PERMISSIONS.RESOURCES_UPDATE, label: 'Update Resources', description: 'Edit resources' },
      { key: PERMISSIONS.RESOURCES_UPDATE_STATUS, label: 'Update Resource Status', description: 'Change resource status' },
      { key: PERMISSIONS.RESOURCES_DELETE, label: 'Delete Resources', description: 'Delete resources' },
    ],
  },
  {
    id: 'bookings',
    label: 'Booking Management',
    description: 'Manage resource bookings',
    permissions: [
      { key: PERMISSIONS.CREATE_BOOKING, label: 'Create Bookings', description: 'Create booking requests' },
      { key: PERMISSIONS.VIEW_OWN_BOOKINGS, label: 'View Own Bookings', description: 'View personal bookings' },
      { key: PERMISSIONS.CANCEL_OWN_BOOKING, label: 'Cancel Own Bookings', description: 'Cancel own bookings' },
      { key: PERMISSIONS.VIEW_ALL_BOOKINGS, label: 'View All Bookings', description: 'View all bookings (admin)' },
      { key: PERMISSIONS.APPROVE_BOOKINGS, label: 'Approve Bookings', description: 'Approve pending bookings' },
      { key: PERMISSIONS.REJECT_BOOKINGS, label: 'Reject Bookings', description: 'Reject pending bookings' },
      { key: PERMISSIONS.CANCEL_ANY_BOOKING, label: 'Cancel Any Booking', description: 'Cancel any booking (admin)' },
    ],
  },
  {
    id: 'tickets',
    label: 'Ticket Management',
    description: 'Manage maintenance and incident tickets',
    permissions: [
      { key: PERMISSIONS.CREATE_TICKET, label: 'Create Tickets', description: 'Create maintenance tickets' },
      { key: PERMISSIONS.VIEW_OWN_TICKETS, label: 'View Own Tickets', description: 'View own tickets' },
      { key: PERMISSIONS.COMMENT_ON_OWN_TICKET, label: 'Comment on Own Tickets', description: 'Add comments to own tickets' },
      { key: PERMISSIONS.VIEW_ASSIGNED_TICKETS, label: 'View Assigned Tickets', description: 'View tickets assigned to you (tech)' },
      { key: PERMISSIONS.UPDATE_TICKET_STATUS, label: 'Update Ticket Status', description: 'Update ticket status (tech)' },
      { key: PERMISSIONS.ADD_RESOLUTION_NOTES, label: 'Add Resolution Notes', description: 'Add resolution notes (tech)' },
      { key: PERMISSIONS.COMMENT_ON_ASSIGNED_TICKET, label: 'Comment on Assigned Tickets', description: 'Comment on assigned tickets (tech)' },
      { key: PERMISSIONS.VIEW_ALL_TICKETS, label: 'View All Tickets', description: 'View all tickets (admin)' },
      { key: PERMISSIONS.ASSIGN_TICKETS, label: 'Assign Tickets', description: 'Assign tickets to technicians' },
      { key: PERMISSIONS.CLOSE_TICKETS, label: 'Close Tickets', description: 'Close tickets (admin)' },
    ],
  },
  {
    id: 'system',
    label: 'System & Reporting',
    description: 'System settings and reports',
    permissions: [
      { key: PERMISSIONS.VIEW_REPORTS, label: 'View Reports', description: 'Access system reports' },
      { key: PERMISSIONS.VIEW_NOTIFICATIONS, label: 'View Notifications', description: 'View notifications' },
      { key: PERMISSIONS.MANAGE_NOTIFICATIONS, label: 'Manage Notifications', description: 'Manage notification settings' },
      { key: PERMISSIONS.SYSTEM_SETTINGS, label: 'System Settings', description: 'Configure system settings' },
    ],
  },
] as const;

// ── Helpers ─────────────────────────────────────────────────────

export function isValidPermission(permission: string): permission is Permission {
  return Object.values(PERMISSIONS).includes(permission as Permission);
}

export function getAllPermissionValues(): string[] {
  return Object.values(PERMISSIONS);
}

/** Returns all permissions (used for ADMIN role seed) */
export const ALL_PERMISSIONS: string[] = getAllPermissionValues();

