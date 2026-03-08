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
