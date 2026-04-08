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

// -- Facilities & Assets ------------------------------------------------------

export type ResourceType = 'LECTURE_HALL' | 'LAB' | 'MEETING_ROOM' | 'EQUIPMENT';
export type ResourceStatus = 'ACTIVE' | 'OUT_OF_SERVICE' | 'UNDER_MAINTENANCE';
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface LocationRequest {
  buildingName: string;
  floorNumber: number;
  roomNumber?: string;
  description?: string;
}

export interface LocationResponse {
  locationId: string;
  buildingName: string;
  floorNumber: number;
  roomNumber: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAvailabilityRequest {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface ResourceAvailabilityResponse {
  availId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface ResourceTagResponse {
  tagId: string;
  tagName: string;
}

export interface ResourceLocationResponse {
  locationId: string;
  buildingName: string;
  floorNumber: number;
  roomNumber: string | null;
}

export interface ResourceRequest {
  name: string;
  type: ResourceType;
  capacity: number;
  locationId?: string;
  status?: ResourceStatus;
  description?: string;
  imageUrl?: string;
  tagIds?: string[];
  availability?: ResourceAvailabilityRequest[];
}

export interface ResourceResponse {
  resourceId: string;
  name: string;
  type: ResourceType;
  capacity: number;
  status: ResourceStatus;
  description: string | null;
  imageUrl: string | null;
  createdBy: string | null;
  createdAt: string;
  location: ResourceLocationResponse | null;
  tags: ResourceTagResponse[];
  availability: ResourceAvailabilityResponse[];
}

export interface UpdateResourceStatusRequest {
  status: ResourceStatus;
}

export interface LocationsListParams {
  building?: string;
  floor?: number;
}

export interface ResourcesListParams {
  type?: ResourceType;
  status?: ResourceStatus;
  locationId?: string;
  tags?: string;
  search?: string;
  minCapacity?: number;
  page?: number;
  size?: number;
  sort?: string;
}
