// ================================================================
//  Smart Campus — Permission Constants
//  Mirrors the backend roles.permissions text[] column values
// ================================================================

export const PERMISSIONS = {
  
  //Management Page Access
  USER_MANAGEMENT_PAGE: 'pages.user_management_page',
  ROLE_MANAGEMENT_PAGE: 'pages.role_management_page',
  FACILITIES_MANAGEMENT_PAGE: 'pages.facilities_management_page',
  BOOKINGS_MANAGEMENT_PAGE_USER: 'pages.bookings_management_page_user',
  BOOKINGS_MANAGEMENT_PAGE_ADMIN: 'pages.bookings_management_page_admin',
  TICKETS_MANAGEMENT_PAGE_USER: 'pages.tickets_management_page_user',
  TICKETS_MANAGEMENT_PAGE_TECHNICIAN: 'pages.tickets_management_page_technician',
  TICKETS_MANAGEMENT_PAGE_ADMIN: 'pages.tickets_management_page_admin',



  // User Management
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE_SOFT: 'users.delete_soft',
  USERS_DELETE: 'users.delete',

  // Role Management
  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  USERS_MANAGE_ROLES: 'users.manage_roles',

  // Facilities & Assets
  LOCATIONS_READ: 'locations.read',
  LOCATIONS_CREATE: 'locations.create',
  LOCATIONS_UPDATE: 'locations.update',
  LOCATIONS_DELETE: 'locations.delete',
  RESOURCES_READ: 'resources.read',
  RESOURCES_CREATE: 'resources.create',
  RESOURCES_UPDATE: 'resources.update',
  RESOURCES_UPDATE_STATUS: 'resources.update_status',
  RESOURCES_DELETE: 'resources.delete',

  // Booking Management (Module B)
  BOOKINGS_CREATE: 'bookings.create',
  BOOKINGS_VIEW_OWN: 'bookings.view_own',
  BOOKINGS_VIEW_ALL: 'bookings.view_all',
  BOOKINGS_APPROVE: 'bookings.approve',
  BOOKINGS_CANCEL_OWN: 'bookings.cancel_own',
  BOOKINGS_CANCEL_ANY: 'bookings.cancel_any',

  // Maintenance & Ticketing (Module C)
  TICKETS_CREATE: 'tickets.create',
  TICKETS_VIEW_OWN: 'tickets.view_own',
  TICKETS_VIEW_ALL: 'tickets.view_all',
  TICKETS_VIEW_ASSIGNED: 'tickets.view_assigned',
  TICKETS_ASSIGN: 'tickets.assign',
  TICKETS_UPDATE_STATUS: 'tickets.update_status',
  TICKETS_CLOSE: 'tickets.close',
  TICKETS_DELETE: 'tickets.delete',
  TICKETS_COMMENT_OWN: 'tickets.comment_own',
  TICKETS_COMMENT_ASSIGNED: 'tickets.comment_assigned',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ── Permission Groups (for UI rendering) ────────────────────────

export const PERMISSION_GROUPS = [
  {
    id: 'user-management',
    label: 'User Management',
    description: 'Manage user accounts and profiles',
    permissions: [
      { key: PERMISSIONS.USERS_READ, label: 'View Users', description: 'View user details and profiles' },
      { key: PERMISSIONS.USERS_CREATE, label: 'Create Users', description: 'Create new user accounts' },
      { key: PERMISSIONS.USERS_UPDATE, label: 'Update Users', description: 'Edit user information' },
      { key: PERMISSIONS.USERS_DELETE_SOFT, label: 'Deactivate Users', description: 'Deactivate user accounts' },
      { key: PERMISSIONS.USERS_DELETE, label: 'Delete Users', description: 'Permanently delete user accounts' },
    ],
  },
  {
    id: 'roles',
    label: 'Role Management',
    description: 'Manage roles and assignments',
    permissions: [
      { key: PERMISSIONS.ROLES_READ, label: 'View Roles', description: 'View roles' },
      { key: PERMISSIONS.ROLES_CREATE, label: 'Create Roles', description: 'Create roles' },
      { key: PERMISSIONS.ROLES_UPDATE, label: 'Update Roles', description: 'Edit roles' },
      { key: PERMISSIONS.ROLES_DELETE, label: 'Delete Roles', description: 'Delete roles' },
      { key: PERMISSIONS.USERS_MANAGE_ROLES, label: 'Manage User Roles', description: 'Assign and modify user roles' },
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
    label: 'Bookings',
    description: 'Request, view, and manage resource bookings',
    permissions: [
      { key: PERMISSIONS.BOOKINGS_CREATE, label: 'Create Booking', description: 'Request a new booking (USER)' },
      { key: PERMISSIONS.BOOKINGS_VIEW_OWN, label: 'View Own Bookings', description: 'View bookings you created (USER)' },
      { key: PERMISSIONS.BOOKINGS_CANCEL_OWN, label: 'Cancel Own Booking', description: 'Cancel your own pending/approved booking (USER)' },
      { key: PERMISSIONS.BOOKINGS_VIEW_ALL, label: 'View All Bookings', description: 'View all bookings (ADMIN)' },
      { key: PERMISSIONS.BOOKINGS_APPROVE, label: 'Approve/Reject Bookings', description: 'Approve or reject pending bookings (ADMIN)' },
      { key: PERMISSIONS.BOOKINGS_CANCEL_ANY, label: 'Cancel Any Booking', description: 'Cancel any booking (ADMIN)' },
    ],
  },
  {
    id: 'maintenance-ticketing',
    label: 'Maintenance & Ticketing',
    description: 'Manage incident tickets and maintenance workflows',
    permissions: [
      { key: PERMISSIONS.TICKETS_CREATE,           label: 'Create Tickets',             description: 'Submit new maintenance/incident tickets (USER)' },
      { key: PERMISSIONS.TICKETS_VIEW_OWN,         label: 'View Own Tickets',           description: 'View tickets you submitted (USER)' },
      { key: PERMISSIONS.TICKETS_VIEW_ALL,         label: 'View All Tickets',           description: 'View every ticket in the system (ADMIN)' },
      { key: PERMISSIONS.TICKETS_VIEW_ASSIGNED,    label: 'View Assigned Tickets',      description: 'View tickets assigned to you (TECHNICIAN)' },
      { key: PERMISSIONS.TICKETS_ASSIGN,           label: 'Assign Tickets',             description: 'Assign tickets to technicians (ADMIN)' },
      { key: PERMISSIONS.TICKETS_UPDATE_STATUS,    label: 'Update Ticket Status',       description: 'Update in-progress ticket status (TECHNICIAN / ADMIN)' },
      { key: PERMISSIONS.TICKETS_CLOSE,            label: 'Close / Reject Tickets',     description: 'Close or reject any ticket (ADMIN)' },
      { key: PERMISSIONS.TICKETS_DELETE,           label: 'Delete Tickets',             description: 'Delete OPEN or REJECTED tickets (ADMIN)' },
      { key: PERMISSIONS.TICKETS_COMMENT_OWN,      label: 'Comment on Own Tickets',     description: 'Add comments to tickets you submitted (USER)' },
      { key: PERMISSIONS.TICKETS_COMMENT_ASSIGNED, label: 'Comment on Assigned Tickets',description: 'Add comments to tickets assigned to you (TECHNICIAN / ADMIN)' },
    ],
  },
  {
    id: 'Management Page Permissions',
    label: 'Management Page Permissions',
    description: 'Access to management page functionalities',
    permissions: [
      { key: PERMISSIONS.USER_MANAGEMENT_PAGE, label: 'View Management Page', description: 'Access the management page (ADMIN)' },
      { key: PERMISSIONS.ROLE_MANAGEMENT_PAGE, label: 'View Role Management', description: 'Access the role management page (ADMIN)' },
      { key: PERMISSIONS.FACILITIES_MANAGEMENT_PAGE, label: 'View Facilities Management', description: 'Access the facilities management page (ADMIN)' },
      { key: PERMISSIONS.BOOKINGS_MANAGEMENT_PAGE_USER, label: 'View Bookings Management (User)', description: 'Access the bookings management page for users (USER)' },
      { key: PERMISSIONS.BOOKINGS_MANAGEMENT_PAGE_ADMIN, label: 'View Bookings Management (Admin)', description: 'Access the bookings management page for admins (ADMIN)' },
      { key: PERMISSIONS.TICKETS_MANAGEMENT_PAGE_USER, label: 'View Tickets Management (User)', description: 'Access the tickets management page for users (USER)' },
      { key: PERMISSIONS.TICKETS_MANAGEMENT_PAGE_TECHNICIAN, label: 'View Tickets Management (Technician)', description: 'Access the tickets management page for technicians (TECHNICIAN)' },
      { key: PERMISSIONS.TICKETS_MANAGEMENT_PAGE_ADMIN, label: 'View Tickets Management (Admin)', description: 'Access the tickets management page for admins (ADMIN)' },
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
