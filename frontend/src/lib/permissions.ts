// ================================================================
//  Smart Campus — Permission Constants
//  Mirrors the backend roles.permissions text[] column values
// ================================================================

export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_ROLES: 'MANAGE_ROLES',
  
  // Resource Management
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
      { key: PERMISSIONS.MANAGE_USERS, label: 'Manage Users', description: 'Create, update, and deactivate users' },
      { key: PERMISSIONS.MANAGE_ROLES, label: 'Manage Roles', description: 'Create and configure roles' },
    ],
  },
  {
    id: 'facilities-assets',
    label: 'Facilities & Assets',
    description: 'Manage campus locations and resources',
    permissions: [
      { key: PERMISSIONS.VIEW_RESOURCES, label: 'View Resources', description: 'View resources and locations' },
      { key: PERMISSIONS.MANAGE_RESOURCES, label: 'Manage Resources', description: 'Create, update, and delete resources' },
      { key: PERMISSIONS.MANAGE_LOCATIONS, label: 'Manage Locations', description: 'Create, update, and delete locations' },
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

