// ================================================================
//  Smart Campus — Permission Constants
//  Mirrors the backend roles.permissions text[] column values
// ================================================================

export const PERMISSIONS = {
  // User Management
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE_SOFT: 'users.delete_soft',
  USERS_DELETE: 'users.delete',

  // Student Group Management
  STUDENTS_READ: 'students.read',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_UPDATE: 'students.update',
  STUDENTS_MANAGE_ENROLLMENT: 'students.manage_enrollment',
  STUDENTS_READ_INACTIVE: 'students.read_inactive',
  STUDENTS_ACTIVATE: 'students.activate',
  STUDENTS_DELETE_SOFT: 'students.delete_soft',
  STUDENTS_DELETE: 'students.delete',

  // Course Management
  COURSES_READ: 'courses.read',
  COURSES_CREATE: 'courses.create',
  COURSES_READ_INACTIVE: 'courses.read_inactive',
  COURSES_UPDATE: 'courses.update',
  COURSES_DELETE_SOFT: 'courses.delete_soft',
  COURSES_DELETE: 'courses.delete',
  COURSES_MANAGE_CONTENT: 'courses.manage_content',

  // Chapter Management
  CHAPTER_READ: 'chapters.read',
  CHAPTER_CREATE: 'chapters.create',
  CHAPTER_UPDATE: 'chapters.update',
  CHAPTER_DELETE: 'chapters.delete',

  // Week Management
  WEEKS_READ: 'weeks.read',
  WEEKS_CREATE: 'weeks.create',
  WEEKS_UPDATE: 'weeks.update',
  WEEKS_DELETE: 'weeks.delete',

  // Content Management
  CONTENT_READ: 'content.read',
  CONTENT_CREATE: 'content.create',
  CONTENT_DELETE: 'content.delete',
  CONTENT_DOWNLOAD: 'content.download',
  CONTENT_VIEW: 'content.view',

  // Trial-exams Management
  MOCK_EXAMS_READ: 'trial_exams.read',
  MOCK_EXAMS_CREATE: 'trial_exams.create',
  MOCK_EXAMS_UPDATE: 'trial_exams.update',
  MOCK_EXAMS_DELETE: 'trial_exams.delete',
  MOCK_EXAMS_DELETE_SOFT: 'trial_exams.delete_soft',
  MOCK_EXAMS_READ_INACTIVE: 'trial_exams.read_inactive',

  // Payment & Billing
  PAYMENTS_PROCESS: 'payments.process',
  INVOICES_READ: 'invoices.read',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_UPDATE: 'invoices.update',
  INVOICES_DELETE: 'invoices.delete',

  // Feedback Management
  FEEDBACK_READ: 'feedback.read',
  FEEDBACK_CREATE: 'feedback.create',
  FEEDBACK_UPDATE: 'feedback.update',
  FEEDBACK_DELETE: 'feedback.delete',

  // Results Management
  RESULTS_READ: 'results.read',
  RESULTS_CREATE: 'results.create',
  RESULTS_UPDATE: 'results.update',

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

  // Settings & Configuration
  SETTINGS_VIEW: 'settings.view',
  ADMIN_UPDATE: 'admin.update',
  ADMIN_CREATE: 'admin.create',
  ADMIN_DELETE: 'admin.delete',

  // Dashboard & Overview
  DASHBOARD_VIEW_ADMIN: 'dashboard.view_admin',
  DASHBOARD_VIEW_STUDENT: 'dashboard.view_student',
  DASHBOARD_VIEW_PARENT: 'dashboard.view_parent',
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
