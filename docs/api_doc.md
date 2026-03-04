# API Documentation

> Smart Campus Resource Management Platform  
> Base URL: `http://localhost:8080/api/v1`  
> Auth: Bearer JWT token in `Authorization` header  
> Last updated: 2026-03-04

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users & Roles](#2-users--roles)
3. [Locations](#3-locations)
4. [Resources](#4-resources)
5. [Bookings](#5-bookings)
6. [Tickets](#6-tickets)
7. [Notifications](#7-notifications)
8. [Common Models](#8-common-models)

---

## 1. Authentication

### POST `/auth/google`

Exchange Google OAuth2 authorization code for a JWT.

**Request:**
```json
{
  "code": "4/0AY0e-g7...",
  "redirectUri": "http://localhost:5173/oauth/callback"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
  "expiresIn": 3600,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@university.edu",
    "fullName": "John Doe",
    "profilePictureUrl": "https://lh3.googleusercontent.com/...",
    "roles": ["USER"],
    "permissions": ["VIEW_RESOURCES", "CREATE_BOOKING", ...]
  }
}
```

### POST `/auth/refresh`

**Request:**
```json
{ "refreshToken": "dGhpcyBpcyBhIHJlZnJl..." }
```

**Response 200:** Same structure as login response.

### POST `/auth/logout`

Invalidates the current refresh token. Returns `204 No Content`.

---

## 2. Users & Roles

### GET `/users`

List all users (ADMIN only). Paginated.

**Query params:** `?page=0&size=20&search=john&role=TECHNICIAN&isActive=true`

**Response 200:**
```json
{
  "content": [
    {
      "userId": "550e8400-...",
      "email": "john@university.edu",
      "fullName": "John Doe",
      "profilePictureUrl": "...",
      "isActive": true,
      "roles": ["USER"],
      "createdAt": "2026-01-15T08:30:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3
}
```

### GET `/users/{userId}`

Get a single user profile.

### GET `/users/me`

Get the currently authenticated user's profile. Returns same shape as `GET /users/{userId}`.

### PATCH `/users/{userId}/roles`

Assign or remove roles (ADMIN only).

**Request:**
```json
{
  "roleNames": ["USER", "TECHNICIAN"]
}
```

**Response 200:** Updated user object.

### PATCH `/users/{userId}/deactivate`

Soft-delete a user (ADMIN only). Returns `204 No Content`.

### GET `/roles`

List all available roles with their permissions.

**Response 200:**
```json
[
  {
    "roleId": "...",
    "roleName": "ADMIN",
    "permissions": ["MANAGE_USERS", "MANAGE_ROLES", ...]
  },
  ...
]
```

---

## 3. Locations

### GET `/locations`

List all locations. Optional filters: `?building=Science+Block&floor=2`

**Response 200:**
```json
[
  {
    "locationId": "...",
    "buildingName": "Science Block",
    "floorNumber": 2,
    "roomNumber": "201A",
    "description": "East wing"
  }
]
```

### POST `/locations`

Create a location (ADMIN only).

**Request:**
```json
{
  "buildingName": "Science Block",
  "floorNumber": 2,
  "roomNumber": "201A",
  "description": "East wing, near elevator"
}
```

**Response 201:** Created location object.

### PUT `/locations/{locationId}`

Update a location (ADMIN only). Full replacement.

### DELETE `/locations/{locationId}`

Delete a location (ADMIN only). Returns `204`. Fails with `409` if resources reference it.

---

## 4. Resources

### GET `/resources`

List resources. Paginated with filters.

**Query params:**
```
?page=0&size=20
&type=LAB
&status=ACTIVE
&locationId=...
&tags=projector,whiteboard
&search=physics
&minCapacity=30
```

**Response 200:**
```json
{
  "content": [
    {
      "resourceId": "...",
      "name": "Physics Lab 3",
      "type": "LAB",
      "capacity": 40,
      "status": "ACTIVE",
      "description": "Equipped with oscilloscopes and spectrum analyzers",
      "imageUrl": "https://...",
      "location": {
        "locationId": "...",
        "buildingName": "Science Block",
        "floorNumber": 2,
        "roomNumber": "201A"
      },
      "tags": ["projector", "computers"],
      "availability": [
        { "dayOfWeek": "MON", "startTime": "08:00", "endTime": "18:00" },
        { "dayOfWeek": "TUE", "startTime": "08:00", "endTime": "18:00" }
      ],
      "createdBy": { "userId": "...", "fullName": "Admin User" },
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ],
  "page": 0, "size": 20, "totalElements": 15, "totalPages": 1
}
```

### GET `/resources/{resourceId}`

Full resource detail including availability windows and tags.

### POST `/resources`

Create a resource (ADMIN only).

**Request:**
```json
{
  "name": "Physics Lab 3",
  "type": "LAB",
  "capacity": 40,
  "locationId": "...",
  "description": "Equipped with oscilloscopes",
  "imageUrl": "https://...",
  "tagIds": ["uuid-projector", "uuid-computers"],
  "availability": [
    { "dayOfWeek": "MON", "startTime": "08:00", "endTime": "18:00" },
    { "dayOfWeek": "TUE", "startTime": "08:00", "endTime": "18:00" }
  ]
}
```

**Response 201:** Full resource object.

### PUT `/resources/{resourceId}`

Update a resource (ADMIN only). Full replacement.

### PATCH `/resources/{resourceId}/status`

Change resource status (ADMIN only).

**Request:**
```json
{ "status": "UNDER_MAINTENANCE" }
```

**Response 200:** Updated resource. Side effect: pending/approved bookings may be auto-cancelled, notifications sent.

### DELETE `/resources/{resourceId}`

Delete a resource (ADMIN only). Returns `204`. Cascade deletes availability, tags map.

### GET `/resources/tags`

List all available tags.

**Response 200:**
```json
[
  { "tagId": "...", "tagName": "projector" },
  { "tagId": "...", "tagName": "whiteboard" }
]
```

---

## 5. Bookings

### GET `/bookings`

List bookings. Filtered by role:
- **USER:** own bookings only (unless ADMIN permission)
- **ADMIN:** all bookings

**Query params:**
```
?page=0&size=20
&status=PENDING
&resourceId=...
&fromDate=2026-03-01&toDate=2026-03-31
&sort=bookingDate,asc
```

**Response 200:**
```json
{
  "content": [
    {
      "bookingId": "...",
      "resource": {
        "resourceId": "...",
        "name": "Physics Lab 3",
        "type": "LAB"
      },
      "user": {
        "userId": "...",
        "fullName": "John Doe",
        "email": "john@university.edu"
      },
      "bookingDate": "2026-03-10",
      "startTime": "09:00",
      "endTime": "11:00",
      "purpose": "Practical session for PHY201",
      "expectedAttendees": 35,
      "status": "PENDING",
      "rejectionReason": null,
      "reviewedBy": null,
      "reviewedAt": null,
      "recurringGroupId": null,
      "createdAt": "2026-03-04T08:00:00Z"
    }
  ],
  "page": 0, "size": 20, "totalElements": 5, "totalPages": 1
}
```

### GET `/bookings/{bookingId}`

Single booking detail.

### POST `/bookings`

Create a booking.

**Request:**
```json
{
  "resourceId": "...",
  "bookingDate": "2026-03-10",
  "startTime": "09:00",
  "endTime": "11:00",
  "purpose": "Practical session for PHY201",
  "expectedAttendees": 35
}
```

**Validation:**
- `endTime > startTime`
- `expectedAttendees <= resource.capacity`
- Time slot within resource's `resource_availability` for that day
- Resource status = `ACTIVE`
- No overlapping APPROVED booking (checked at DB level too)

**Response 201:** Booking object with `status: "PENDING"`.

**Error 409:** Conflict — time slot already booked.

### POST `/bookings/recurring`

Create a recurring booking series.

**Request:**
```json
{
  "resourceId": "...",
  "recurrenceRule": "FREQ=WEEKLY;BYDAY=MO,WE",
  "startDate": "2026-03-10",
  "endDate": "2026-06-30",
  "startTime": "09:00",
  "endTime": "11:00",
  "purpose": "PHY201 weekly practical"
}
```

**Response 201:** `{ "groupId": "...", "bookingsCreated": 32 }`

### PATCH `/bookings/{bookingId}/approve`

Approve a pending booking (ADMIN only).

**Request:** `{}` (empty body; or optional comment)

**Response 200:** Updated booking with `status: "APPROVED"`.

### PATCH `/bookings/{bookingId}/reject`

Reject a pending booking (ADMIN only).

**Request:**
```json
{ "rejectionReason": "Lab is reserved for exams that week" }
```

**Response 200:** Updated booking with `status: "REJECTED"`.

### PATCH `/bookings/{bookingId}/cancel`

Cancel a booking (owner or ADMIN).

**Response 200:** Updated booking with `status: "CANCELLED"`.

### GET `/bookings/availability`

Check available time slots for a resource on a date.

**Query params:** `?resourceId=...&date=2026-03-10`

**Response 200:**
```json
{
  "date": "2026-03-10",
  "dayOfWeek": "TUE",
  "resourceAvailability": { "startTime": "08:00", "endTime": "18:00" },
  "bookedSlots": [
    { "startTime": "09:00", "endTime": "11:00", "status": "APPROVED" },
    { "startTime": "14:00", "endTime": "16:00", "status": "PENDING" }
  ]
}
```

---

## 6. Tickets

### GET `/tickets`

List tickets. Filtered by role:
- **USER:** own tickets (`reporter_id`)
- **TECHNICIAN:** assigned tickets (`assigned_tech_id`)
- **ADMIN:** all tickets

**Query params:**
```
?page=0&size=20
&status=OPEN,IN_PROGRESS
&priority=HIGH,CRITICAL
&category=Electrical
&resourceId=...
&sort=priority,desc
```

**Response 200:**
```json
{
  "content": [
    {
      "ticketId": "...",
      "resource": { "resourceId": "...", "name": "Lecture Hall A" },
      "reporter": { "userId": "...", "fullName": "Jane Smith" },
      "assignedTech": null,
      "category": "Electrical",
      "description": "Projector not turning on",
      "priority": "HIGH",
      "status": "OPEN",
      "resolutionNotes": null,
      "dueDate": null,
      "resolvedAt": null,
      "attachmentCount": 2,
      "commentCount": 0,
      "createdAt": "2026-03-03T14:30:00Z",
      "updatedAt": "2026-03-03T14:30:00Z"
    }
  ],
  "page": 0, "size": 20, "totalElements": 8, "totalPages": 1
}
```

### GET `/tickets/{ticketId}`

Full ticket detail including attachments, comments, and status history.

**Response 200:**
```json
{
  "ticketId": "...",
  "resource": { ... },
  "reporter": { ... },
  "assignedTech": { "userId": "...", "fullName": "Tech User" },
  "category": "Electrical",
  "description": "Projector not turning on",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "resolutionNotes": null,
  "dueDate": "2026-03-06",
  "resolvedAt": null,
  "attachments": [
    {
      "attachmentId": "...",
      "fileUrl": "https://storage.../projector-error.jpg",
      "fileName": "projector-error.jpg",
      "fileSize": 245000,
      "uploadedBy": { "userId": "...", "fullName": "Jane Smith" },
      "uploadedAt": "2026-03-03T14:31:00Z"
    }
  ],
  "comments": [
    {
      "commentId": "...",
      "author": { "userId": "...", "fullName": "Tech User" },
      "content": "On my way to check this now",
      "createdAt": "2026-03-04T09:00:00Z"
    }
  ],
  "statusHistory": [
    {
      "historyId": "...",
      "changedBy": { "userId": "...", "fullName": "Admin" },
      "oldStatus": "OPEN",
      "newStatus": "IN_PROGRESS",
      "note": "Assigned to Tech User",
      "changedAt": "2026-03-04T08:45:00Z"
    }
  ],
  "createdAt": "2026-03-03T14:30:00Z",
  "updatedAt": "2026-03-04T09:00:00Z"
}
```

### POST `/tickets`

Create a ticket.

**Request:**
```json
{
  "resourceId": "...",
  "category": "Electrical",
  "description": "Projector not turning on in Lecture Hall A",
  "priority": "HIGH"
}
```

**Response 201:** Ticket object.

### POST `/tickets/{ticketId}/attachments`

Upload attachment(s). Multipart form data.

**Request:** `Content-Type: multipart/form-data` with `file` field.

**Response 201:**
```json
{
  "attachmentId": "...",
  "fileUrl": "https://storage.../...",
  "fileName": "photo.jpg",
  "fileSize": 245000
}
```

### PATCH `/tickets/{ticketId}/assign`

Assign a technician (ADMIN only).

**Request:**
```json
{
  "assignedTechId": "...",
  "dueDate": "2026-03-06"
}
```

**Response 200:** Updated ticket.

### PATCH `/tickets/{ticketId}/status`

Update ticket status (TECHNICIAN for assigned tickets, ADMIN for any).

**Request:**
```json
{
  "status": "RESOLVED",
  "resolutionNotes": "Replaced projector bulb. Working now.",
  "note": "Bulb was burnt out"
}
```

**Allowed transitions:**
- `OPEN` → `IN_PROGRESS`, `REJECTED`, `CLOSED`
- `IN_PROGRESS` → `RESOLVED`, `CLOSED`
- `RESOLVED` → `CLOSED`, `IN_PROGRESS` (reopen)

**Response 200:** Updated ticket. Side effect: status history row created, notifications sent.

### POST `/tickets/{ticketId}/comments`

Add a comment to a ticket.

**Request:**
```json
{ "content": "On my way to check this now" }
```

**Response 201:** Comment object.

### GET `/tickets/{ticketId}/comments`

List all comments for a ticket (paginated).

---

## 7. Notifications

### GET `/notifications`

List notifications for the current user.

**Query params:** `?page=0&size=20&isRead=false`

**Response 200:**
```json
{
  "content": [
    {
      "notificationId": "...",
      "title": "Booking Approved",
      "message": "Your booking for Physics Lab 3 on Mar 10 has been approved.",
      "type": "BOOKING_APPROVED",
      "isRead": false,
      "relatedEntityId": "booking-uuid-here",
      "createdAt": "2026-03-04T10:00:00Z"
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1,
  "unreadCount": 2
}
```

### PATCH `/notifications/{notificationId}/read`

Mark a single notification as read. Returns `204`.

### PATCH `/notifications/read-all`

Mark all notifications as read for the current user. Returns `204`.

### GET `/notifications/unread-count`

**Response 200:**
```json
{ "count": 5 }
```

---

## 8. Common Models

### Error Response

```json
{
  "timestamp": "2026-03-04T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/bookings",
  "fieldErrors": [
    { "field": "endTime", "message": "must be after startTime" },
    { "field": "expectedAttendees", "message": "must be greater than 0" }
  ]
}
```

### Paginated Response Wrapper

```json
{
  "content": [ ... ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3
}
```

### HTTP Status Codes Used

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful read or update |
| 201 | Created | Successful creation |
| 204 | No Content | Successful delete, logout, mark-read |
| 400 | Bad Request | Validation failure |
| 401 | Unauthorized | Missing or expired token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Entity not found |
| 409 | Conflict | Booking overlap, duplicate entry |
| 422 | Unprocessable Entity | Business rule violation |
| 500 | Internal Server Error | Unexpected server error |
