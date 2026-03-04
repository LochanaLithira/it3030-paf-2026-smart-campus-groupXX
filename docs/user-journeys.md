# Smart Campus Resource Management Platform — User Journeys

> Last updated: 2026-03-04

---

## Table of Contents

1. [Roles & Permissions Overview](#1-roles--permissions-overview)
2. [User Journeys — Regular User (Student / Lecturer)](#2-user-journeys--regular-user)
3. [User Journeys — Admin](#3-user-journeys--admin)
4. [User Journeys — Technician](#4-user-journeys--technician)
5. [Cross-Cutting Flows](#5-cross-cutting-flows)

---

## 1. Roles & Permissions Overview

| Role | Key Permissions |
|------|----------------|
| **ADMIN** | Manage users & roles, manage resources & locations, approve/reject bookings, assign tickets, view reports, system settings |
| **USER** | View resources, create/cancel own bookings, create tickets, comment on own tickets, view notifications |
| **TECHNICIAN** | View assigned tickets, update ticket status, add resolution notes, comment on assigned tickets, create tickets |

---

## 2. User Journeys — Regular User

### 2.1 Registration & Authentication

```
Landing Page → "Sign in with Google" → OAuth 2.0 Consent Screen → Redirect back
→ System creates user record (if first login) and assigns default 'USER' role
→ Dashboard
```

1. User visits the platform landing page.
2. Clicks **"Sign in with Google"**.
3. Google OAuth consent screen appears; user grants access.
4. On successful auth, the system:
   - Checks if `email` already exists in `users`.
   - If **new**: creates a `users` row, assigns the `USER` role via `user_roles`.
   - If **existing**: updates `oauth_provider_id` / `profile_picture_url` if changed.
5. User lands on the **Dashboard**.

---

### 2.2 Browsing & Filtering Resources

```
Dashboard → "Resources" → Filter by type/location/tags → View resource detail card
→ See availability calendar → Proceed to book
```

1. User clicks **Resources** in the navigation bar.
2. Resource listing loads (cards/table) with filters:
   - **Type**: Lecture Hall, Lab, Meeting Room, Equipment
   - **Building / Floor**: dropdown populated from `locations`
   - **Tags**: checkboxes (projector, whiteboard, etc.) from `resource_tags`
   - **Status**: Active only by default
3. User clicks a resource card to see:
   - Description, capacity, image, location details
   - Weekly availability grid (from `resource_availability`)
   - Upcoming bookings on the selected day
4. User clicks **"Book this Resource"** → routed to booking form.

---

### 2.3 Creating a Booking

```
Resource Detail → "Book" → Fill form (date, time, purpose, attendees)
→ Submit → Booking created with status PENDING → Notification sent to Admin
→ User sees booking in "My Bookings" list
```

1. Booking form pre-fills the resource name.
2. User selects:
   - **Date** (date picker, future dates only)
   - **Start time / End time** (constrained to resource availability for that day)
   - **Purpose** (text area, required)
   - **Expected attendees** (number input)
3. Client validates:
   - `end_time > start_time`
   - `expected_attendees <= resource.capacity`
   - Time slot falls within `resource_availability` window
4. On submit, backend:
   - Creates `bookings` row with `status = 'PENDING'`.
   - Creates a `notifications` row for every ADMIN (`type = 'BOOKING_CREATED'`).
5. User sees confirmation toast and can view the booking in **"My Bookings"**.

---

### 2.4 Managing Own Bookings

```
Dashboard → "My Bookings" → List of bookings (Pending / Approved / Rejected / Cancelled)
→ Click booking → View details → Cancel (if Pending or Approved)
```

1. User navigates to **My Bookings** (filtered by `user_id`).
2. Each booking row shows: resource name, date, time, status badge.
3. User can **cancel** a booking if status is `PENDING` or `APPROVED`:
   - Status updates to `CANCELLED`.
   - Notification sent to ADMIN.
4. If a booking was `REJECTED`, user sees the `rejection_reason`.

---

### 2.5 Reporting a Maintenance Issue

```
Resource Detail → "Report Issue" → Fill ticket form (category, description, priority, attachments)
→ Submit → Ticket created with status OPEN → Admin notified
```

1. From a resource detail page, user clicks **"Report Issue"**.
2. Ticket form:
   - **Category**: dropdown (Electrical, Plumbing, IT/Network, Furniture, HVAC, Other)
   - **Description**: text area (required)
   - **Priority**: LOW (default), MEDIUM, HIGH, CRITICAL
   - **Attachments**: file upload (images/docs, stored as URLs in `ticket_attachments`)
3. On submit:
   - `tickets` row created (`status = 'OPEN'`, `reporter_id = current user`).
   - Attachments stored in `ticket_attachments`.
   - Notification to all ADMINs (`type = 'TICKET_CREATED'`).
4. User can track the ticket in **"My Tickets"**.

---

### 2.6 Tracking & Commenting on Own Tickets

```
"My Tickets" → Select ticket → View status, assigned technician, comments timeline
→ Add comment → Comment saved → Technician notified
```

1. User opens **My Tickets** list (filtered by `reporter_id`).
2. Clicks a ticket to see:
   - Current status & priority
   - Assigned technician (if any)
   - Status history timeline (from `ticket_status_history`)
   - Comments thread (from `ticket_comments`)
   - Attachments
3. User can add a comment (text). On submit:
   - `ticket_comments` row created.
   - Notification sent to assigned technician (`type = 'TICKET_UPDATED'`).

---

### 2.7 Viewing Notifications

```
Bell icon (badge count) → Notification dropdown → Click notification
→ Navigate to related entity (booking / ticket) → Mark as read
```

1. Bell icon in the header shows unread count (`is_read = FALSE`).
2. Clicking opens a dropdown/panel listing recent notifications.
3. Each notification shows: title, message, timestamp, type icon.
4. Clicking a notification:
   - Marks it as read (`is_read = TRUE`).
   - Navigates to the related booking or ticket using `related_entity_id`.

---

## 3. User Journeys — Admin

### 3.1 Admin Dashboard

```
Login → Admin Dashboard → Quick stats: pending bookings, open tickets, resource utilization
→ Action shortcuts to approval queue, ticket triage, resource management
```

1. Admin lands on a dashboard with summary cards:
   - **Pending Bookings** count (link to approval queue)
   - **Open Tickets** count (link to ticket triage)
   - **Resources by Status** (Active, Out of Service, Under Maintenance)
2. Quick action buttons for common tasks.

---

### 3.2 Managing Resources & Locations

```
Admin → "Manage Resources" → Add / Edit / Deactivate resources
→ Set availability windows → Assign tags
```

1. Admin can **create a new resource**:
   - Name, type, capacity, description, image
   - Select or create a location (building, floor, room)
   - Set weekly availability windows (multiple `resource_availability` rows)
   - Assign tags from `resource_tags`
2. Admin can **edit** an existing resource (all fields).
3. Admin can change status to `OUT_OF_SERVICE` or `UNDER_MAINTENANCE`:
   - Optionally auto-cancel pending/approved bookings for that resource.
   - Notification sent to affected users.

#### Managing Locations

```
Admin → "Locations" → Add / Edit buildings and floors
```

1. Admin creates locations (building name, floor number, room number).
2. Locations are referenced when creating/editing resources.

---

### 3.3 Approving / Rejecting Bookings

```
Admin → "Booking Approvals" → List of PENDING bookings → Review details
→ Approve or Reject (with reason) → User notified
```

1. Admin opens the **Booking Approvals** queue (all bookings with `status = 'PENDING'`).
2. Each entry shows: requester name, resource, date/time, purpose, attendees.
3. Admin clicks a booking to review:
   - Resource availability for the requested slot
   - Any conflicting approved bookings
4. Admin clicks **Approve**:
   - `status → 'APPROVED'`, `reviewed_by` and `reviewed_at` set.
   - Exclusion constraint guarantees no overlap.
   - Notification to user (`type = 'BOOKING_APPROVED'`).
5. Or Admin clicks **Reject**:
   - Must provide `rejection_reason`.
   - `status → 'REJECTED'`.
   - Notification to user (`type = 'BOOKING_REJECTED'`).

---

### 3.4 Ticket Triage & Assignment

```
Admin → "All Tickets" → Filter by status/priority → Select ticket
→ Assign to technician → Technician notified
```

1. Admin sees all tickets (filterable by status, priority, category, resource).
2. For an `OPEN` ticket, admin clicks **Assign**:
   - Selects a technician from users with `TECHNICIAN` role.
   - `assigned_tech_id` updated, `status → 'IN_PROGRESS'`.
   - `ticket_status_history` row recorded.
   - Notification to technician (`type = 'TICKET_ASSIGNED'`).
3. Admin can also directly close/reject tickets with a note.

---

### 3.5 User & Role Management

```
Admin → "Users" → View all users → Change roles / deactivate accounts
```

1. Admin views the user list with current roles.
2. Admin can:
   - **Assign/remove roles** (insert/delete `user_roles` rows).
   - **Deactivate** a user (`is_active = FALSE`) — prevents login.
   - View a user's booking and ticket history.
3. Role changes trigger a notification to the affected user (`type = 'ROLE_CHANGE'`).

---

## 4. User Journeys — Technician

### 4.1 Technician Dashboard

```
Login → Technician Dashboard → Assigned tickets list (sorted by priority)
→ Select ticket → View details, comments, attachments
```

1. Technician's dashboard shows tickets assigned to them.
2. Sorted by priority (CRITICAL → HIGH → MEDIUM → LOW), then by creation date.
3. Status filter: IN_PROGRESS (default), OPEN, RESOLVED.

---

### 4.2 Working on a Ticket

```
Ticket Detail → Update status (IN_PROGRESS → RESOLVED) → Add resolution notes
→ Reporter & Admin notified
```

1. Technician opens an assigned ticket.
2. Views: resource details, description, attachments, comment thread, status history.
3. Technician can:
   - **Add comments** (communicating with the reporter).
   - **Update status**:
     - `IN_PROGRESS` → `RESOLVED` (must add `resolution_notes`).
     - Each status change logs to `ticket_status_history`.
   - **Upload attachments** (e.g. photos of completed repair).
4. On resolution:
   - `resolved_at` timestamp set.
   - Notification to reporter (`type = 'TICKET_RESOLVED'`).
   - Notification to admin.
5. Admin can then **close** the ticket after verification.

---

### 4.3 Creating a Follow-up Ticket

```
Ticket Detail → "Create Follow-up" → Pre-filled form referencing original resource
→ Submit → New ticket linked by category note
```

1. If a technician discovers an additional issue during maintenance, they can create a new ticket from the existing ticket's page.
2. The new ticket is pre-populated with the same resource and a reference to the original ticket in the description.

---

## 5. Cross-Cutting Flows

### 5.1 Notification Lifecycle

| Event | Notification Type | Recipients |
|-------|-------------------|------------|
| New booking created | `BOOKING_CREATED` | All ADMINs |
| Booking approved | `BOOKING_APPROVED` | Booking owner |
| Booking rejected | `BOOKING_REJECTED` | Booking owner |
| Booking cancelled by user | `BOOKING_CANCELLED` | All ADMINs |
| Booking cancelled by admin | `BOOKING_CANCELLED` | Booking owner |
| New ticket created | `TICKET_CREATED` | All ADMINs |
| Ticket assigned | `TICKET_ASSIGNED` | Assigned technician |
| Ticket comment added | `TICKET_UPDATED` | Reporter + assigned tech (whoever didn't comment) |
| Ticket resolved | `TICKET_RESOLVED` | Reporter + all ADMINs |
| Resource put under maintenance | `MAINTENANCE_ALERT` | Users with approved bookings on that resource |
| Role changed | `ROLE_CHANGE` | Affected user |

### 5.2 Booking Conflict Resolution

```
User submits booking → Backend checks:
  1. Resource availability (day_of_week + time window)
  2. No overlapping APPROVED booking (exclusion constraint)
  3. Resource status = ACTIVE
→ If all pass → PENDING booking created
→ If any fail → Error returned with reason
```

### 5.3 Resource Status Change Impact

```
Admin sets resource to OUT_OF_SERVICE or UNDER_MAINTENANCE →
  1. All PENDING bookings for that resource → auto-CANCELLED
  2. All APPROVED future bookings → notification sent with option to rebook
  3. Resource hidden from default browse (or shown with warning badge)
```

### 5.4 Authentication Flow (OAuth 2.0 + Google)

```
Browser → GET /oauth2/authorization/google → Google Login
→ Google callback with auth code → Backend exchanges for tokens
→ Extract email, name, picture from ID token
→ Upsert user record → Issue session/JWT → Redirect to Dashboard
```

---

## Appendix: Page Map

| Page | Route | Accessible By |
|------|-------|---------------|
| Landing / Login | `/` | All (unauthenticated) |
| Dashboard | `/dashboard` | USER, ADMIN, TECHNICIAN |
| Resource Listing | `/resources` | USER, ADMIN |
| Resource Detail | `/resources/:id` | USER, ADMIN |
| Create Booking | `/bookings/new?resource=:id` | USER |
| My Bookings | `/bookings` | USER |
| Booking Approvals | `/admin/bookings` | ADMIN |
| My Tickets | `/tickets` | USER |
| All Tickets | `/admin/tickets` | ADMIN |
| Assigned Tickets | `/tech/tickets` | TECHNICIAN |
| Ticket Detail | `/tickets/:id` | USER, ADMIN, TECHNICIAN |
| Create Ticket | `/tickets/new?resource=:id` | USER, TECHNICIAN |
| Manage Resources | `/admin/resources` | ADMIN |
| Manage Locations | `/admin/locations` | ADMIN |
| User Management | `/admin/users` | ADMIN |
| Notifications | `/notifications` | USER, ADMIN, TECHNICIAN |
| Profile | `/profile` | USER, ADMIN, TECHNICIAN |
