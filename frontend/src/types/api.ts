// ================================================================
//  Smart Campus — API TypeScript Types
//  Mirror of backend DTOs
// ================================================================

// ── Common ───────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}

// ── Auth ─────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface LoginRequest {
  code: string;
  redirectUri: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  roleId?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ── User ─────────────────────────────────────────────────────────

export interface UserResponse {
  userId: string;
  email: string;
  fullName: string;
  profilePictureUrl: string | null;
  active: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
}

export interface UserSummaryResponse {
  userId: string;
  email: string;
  fullName: string;
  profilePictureUrl: string | null;
}

export interface UpdateRolesRequest {
  roleNames: string[];
}

export interface UsersListParams {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

// ── Role ─────────────────────────────────────────────────────────

export interface RoleResponse {
  roleId: string;
  roleName: string;
  permissions: string[];
}

export interface CreateRoleRequest {
  roleName: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  permissions: string[];
}

// ── Notification ─────────────────────────────────────────────────

export interface NotificationResponse {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}
