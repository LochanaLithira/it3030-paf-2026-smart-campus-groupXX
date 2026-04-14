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
  details?: Record<string, unknown>;
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

export type NotificationCategory = 'BOOKING' | 'TICKET' | 'COMMENT' | 'SYSTEM';

export type NotificationType =
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'TICKET_CREATED'
  | 'TICKET_STATUS_CHANGED'
  | 'TICKET_ASSIGNED'
  | 'TICKET_RESOLVED'
  | 'TICKET_REJECTED'
  | 'COMMENT_ADDED'
  | 'GENERAL';

export interface NotificationDTO {
  id: string;
  recipientUserId: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  referenceId: string | null;
  referenceType: 'BOOKING' | 'TICKET' | 'COMMENT' | string | null;
}

export interface NotificationPreferenceDTO {
  id: string;
  userId: string;
  category: NotificationCategory;
  enabled: boolean;
}

export interface UpdatePreferenceRequest {
  category: NotificationCategory;
  enabled: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export interface BulkReadResponse {
  updated: number;
}

// -- Facilities & Assets ------------------------------------------------------

export type ResourceType = 'LECTURE_HALL' | 'LAB' | 'MEETING_ROOM' | 'EQUIPMENT';
export type ResourceStatus = 'ACTIVE' | 'OUT_OF_SERVICE' | 'UNDER_MAINTENANCE';
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type AvailabilityRecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

// -- Bookings ----------------------------------------------------------------

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface BookingCreateRequest {
  resourceId?: string;
  locationId?: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  purpose: string;
  expectedAttendees: number;
}

export interface BookingResourceSummary {
  resourceId: string | null;
  locationId: string | null;
  name: string;
  type: ResourceType;
}

export interface BookingUserSummary {
  userId: string;
  fullName: string;
  email: string;
}

export interface BookingResponse {
  bookingId: string;
  resource: BookingResourceSummary;
  user: BookingUserSummary;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  expectedAttendees: number;
  status: BookingStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  recurringGroupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingAvailabilityResponse {
  date: string;
  dayOfWeek: DayOfWeek;
  resourceAvailability: { startTime: string; endTime: string } | null;
  bookedSlots: { startTime: string; endTime: string; status: BookingStatus }[];
}

export interface LocationRequest {
  buildingName: string;
  floorNumber: number;
  roomNumber?: string;
  capacity: number;
  type: Exclude<ResourceType, 'EQUIPMENT'>;
  status: ResourceStatus;
  tagIds?: string[];
  availability?: LocationAvailabilityRequest[];
}

export interface LocationAvailabilityRequest {
  recurrenceType: AvailabilityRecurrenceType;
  dayOfWeek?: DayOfWeek;
  dayOfMonth?: number;
  startTime: string;
  endTime: string;
}

export interface LocationAvailabilityResponse {
  availId: string;
  recurrenceType: AvailabilityRecurrenceType;
  dayOfWeek: DayOfWeek | null;
  dayOfMonth: number | null;
  startTime: string;
  endTime: string;
}

export interface LocationResponse {
  locationId: string;
  buildingName: string;
  floorNumber: number;
  roomNumber: string | null;
  capacity: number;
  type: Exclude<ResourceType, 'EQUIPMENT'>;
  status: ResourceStatus;
  tags: ResourceTagResponse[];
  availability: LocationAvailabilityResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAvailabilityRequest {
  recurrenceType: AvailabilityRecurrenceType;
  dayOfWeek?: DayOfWeek;
  dayOfMonth?: number;
  startTime: string;
  endTime: string;
}

export interface ResourceAvailabilityResponse {
  availId: string;
  recurrenceType: AvailabilityRecurrenceType;
  dayOfWeek: DayOfWeek | null;
  dayOfMonth: number | null;
  startTime: string;
  endTime: string;
}

export interface ResourceTagResponse {
  tagId: string;
  tagName: string;
}

export interface ResourceTagRequest {
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
  status?: ResourceStatus;
  tagIds?: string[];
  availability?: ResourceAvailabilityRequest[];
}

export interface ResourceResponse {
  resourceId: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  createdBy: string | null;
  createdAt: string;
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
  tags?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// ── Tickets ──────────────────────────────────────────────────────

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketCategory = 
  | 'ELECTRICAL' 
  | 'PLUMBING' 
  | 'HVAC' 
  | 'IT' 
  | 'FURNITURE' 
  | 'GENERAL_MAINTENANCE' 
  | 'OTHER';

export interface TicketResourceResponse {
  resourceId: string | null;
  locationId: string | null;
  name: string;
  type: ResourceType;
}

export interface TicketRequest {
  resourceId?: string;
  locationId?: string;
  category: TicketCategory;
  description: string;
  priority: TicketPriority;
  preferredContactEmail?: string;  // PDF requirement (Member 3)
  preferredContactPhone?: string;  // PDF requirement (Member 3)
  dueDate?: string; // ISO date string (yyyy-MM-dd)
  attachments?: File[]; // For frontend form only - sent separately
}

export interface TicketResponse {
  ticketId: string;
  resource: TicketResourceResponse;
  reporter: UserSummaryResponse;
  assignedTech: UserSummaryResponse | null;
  category: TicketCategory;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  preferredContactEmail: string | null;   // PDF requirement (Member 3)
  preferredContactPhone: string | null;   // PDF requirement (Member 3)
  resolutionNotes: string | null;
  dueDate: string | null; // ISO date string
  resolvedAt: string | null; // ISO timestamp
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  attachments: TicketAttachmentResponse[];
  comments: TicketCommentResponse[];
  statusHistory: StatusHistoryResponse[];
}

export interface TicketSummaryResponse {
  ticketId: string;
  resource: TicketResourceResponse;
  reporter: UserSummaryResponse;
  assignedTech: UserSummaryResponse | null;
  category: TicketCategory;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  preferredContactEmail: string | null;   // PDF requirement (Member 3)
  preferredContactPhone: string | null;   // PDF requirement (Member 3)
  attachmentCount: number;
  commentCount: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketAttachmentResponse {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface TicketCommentRequest {
  content: string;
}

export interface TicketCommentResponse {
  commentId: string;
  author: UserSummaryResponse;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryResponse {
  historyId: string;
  oldStatus: TicketStatus | null;
  newStatus: TicketStatus;
  changedBy: UserSummaryResponse;
  notes: string | null;
  changedAt: string;
}

export interface TicketAssignRequest {
  assignedTechId: string;
  dueDate: string; // ISO date string (yyyy-MM-dd)
}

export interface TicketStatusUpdateRequest {
  newStatus: TicketStatus;
  note?: string;  // Backend uses 'note' not 'notes'
}

export interface TicketsListParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  resourceId?: string;
  locationId?: string;
  assignedTechId?: string;
  page?: number;
  size?: number;
  sort?: string;
}
