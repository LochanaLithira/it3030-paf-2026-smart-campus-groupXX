# Task Breakdown by Member

> Smart Campus Resource Management Platform  
> Last updated: 2026-03-04

---

## Legend

- **Priority:** P0 (blocker) · P1 (critical) · P2 (important) · P3 (nice-to-have)
- **Status:** `[ ]` Not started · `[~]` In progress · `[x]` Done

---

## Member 1 — Facilities & Assets

### Backend

| # | Task | Priority | Status | Sprint |
|---|------|----------|--------|--------|
| M1-B01 | Create `Location` JPA entity with auditing | P0 | `[ ]` | 1 |
| M1-B02 | Create `Resource` JPA entity with enum mappings | P0 | `[ ]` | 1 |
| M1-B03 | Create `ResourceAvailability` entity | P0 | `[ ]` | 1 |
| M1-B04 | Create `ResourceTag` + `ResourceTagMap` entities | P1 | `[ ]` | 1 |
| M1-B05 | Create `LocationRepository` with custom queries | P0 | `[ ]` | 1 |
| M1-B06 | Create `ResourceRepository` with filtering (type, status, capacity, search) | P0 | `[ ]` | 2 |
| M1-B07 | Create `ResourceAvailabilityRepository` | P0 | `[ ]` | 2 |
| M1-B08 | Create `ResourceTagRepository` | P1 | `[ ]` | 2 |
| M1-B09 | Implement `LocationService` — CRUD | P0 | `[ ]` | 2 |
| M1-B10 | Implement `ResourceService` — CRUD + tag assignment + availability management | P0 | `[ ]` | 2 |
| M1-B11 | Implement `ResourceController` — GET list (paginated, filtered), GET detail, POST, PUT, PATCH status, DELETE | P0 | `[ ]` | 2 |
| M1-B12 | Implement `LocationController` — GET list, POST, PUT, DELETE | P0 | `[ ]` | 2 |
| M1-B13 | GET `/resources/tags` endpoint | P1 | `[ ]` | 2 |
| M1-B14 | Resource status change → auto-cancel affected bookings (integrate with M2) | P1 | `[ ]` | 4 |
| M1-B15 | `@PreAuthorize` on all admin-only endpoints | P0 | `[ ]` | 2 |
| M1-B16 | Flyway migration `V1__initial_schema.sql` from schema.sql | P0 | `[ ]` | 0 |
| M1-B17 | Unit tests for `ResourceService` | P1 | `[ ]` | 2 |
| M1-B18 | Integration tests for `ResourceController` (Testcontainers) | P1 | `[ ]` | 5 |

### Frontend

| # | Task | Priority | Status | Sprint |
|---|------|----------|--------|--------|
| M1-F01 | `ResourceListPage` — card/table view with filters (type, building, tags, search) | P0 | `[ ]` | 2 |
| M1-F02 | `useResources` hook — TanStack Query wrapper for resource API | P0 | `[ ]` | 2 |
| M1-F03 | `ResourceDetailPage` — description, capacity, location, image, availability grid | P0 | `[ ]` | 2 |
| M1-F04 | `AvailabilityGrid` component — weekly time slots visualization | P1 | `[ ]` | 2 |
| M1-F05 | `ResourceForm` — admin create/edit resource with tag selector + availability editor | P0 | `[ ]` | 2 |
| M1-F06 | `LocationManagementPage` — admin CRUD locations table | P0 | `[ ]` | 2 |
| M1-F07 | `LocationForm` — create/edit location dialog | P0 | `[ ]` | 2 |
| M1-F08 | Resource status badge component | P2 | `[ ]` | 2 |
| M1-F09 | Resource image upload integration | P2 | `[ ]` | 4 |
| M1-F10 | Empty states and loading skeletons for resource pages | P2 | `[ ]` | 4 |

---

## Member 2 — Booking Management

### Backend

| # | Task | Priority | Status | Sprint |
|---|------|----------|--------|--------|
| M2-B01 | Create `Booking` JPA entity (with exclusion constraint mapping) | P0 | `[ ]` | 1 |
| M2-B02 | Create `RecurringBookingGroup` entity | P2 | `[ ]` | 1 |
| M2-B03 | Create `BookingRepository` with custom queries (by user, resource, date range, status) | P0 | `[ ]` | 2 |
| M2-B04 | `BookingValidationService` — check availability window, overlap, capacity, resource status | P0 | `[ ]` | 2 |
| M2-B05 | `BookingService` — create booking (validates + saves + notifies admins) | P0 | `[ ]` | 2 |
| M2-B06 | `BookingService` — cancel booking (owner or admin) + notification | P0 | `[ ]` | 2 |
| M2-B07 | `BookingService` — approve/reject (admin) + notification | P0 | `[ ]` | 2 |
| M2-B08 | `BookingService` — list with pagination + filtering | P0 | `[ ]` | 2 |
| M2-B09 | `BookingController` — GET list, GET detail, POST create, PATCH approve/reject/cancel | P0 | `[ ]` | 2 |
| M2-B10 | GET `/bookings/availability` — available slots for resource+date | P1 | `[ ]` | 2 |
| M2-B11 | POST `/bookings/recurring` — create recurring booking series | P2 | `[ ]` | 2 |
| M2-B12 | Handle double-booking conflict gracefully (catch DB exclusion constraint, return 409) | P0 | `[ ]` | 2 |
| M2-B13 | `@PreAuthorize` on all endpoints | P0 | `[ ]` | 2 |
| M2-B14 | Unit tests for `BookingValidationService` | P1 | `[ ]` | 2 |
| M2-B15 | Integration tests for `BookingController` | P1 | `[ ]` | 5 |

### Frontend

| # | Task | Priority | Status | Sprint |
|---|------|----------|--------|--------|
| M2-F01 | `BookingForm` — date picker, time selector (constrained), purpose, attendees | P0 | `[ ]` | 2 |
| M2-F02 | `useBookings` hook — TanStack Query wrapper | P0 | `[ ]` | 2 |
| M2-F03 | `BookingListPage` ("My Bookings") — status-filtered table with cancel action | P0 | `[ ]` | 2 |
| M2-F04 | `BookingDetailPage` — full booking info with status badge | P0 | `[ ]` | 2 |
| M2-F05 | `BookingApprovalQueue` — admin queue with approve/reject buttons + reason dialog | P0 | `[ ]` | 2 |
| M2-F06 | Availability slot picker component (visual time blocks) | P1 | `[ ]` | 2 |
| M2-F07 | Optimistic UI update for booking cancellation | P2 | `[ ]` | 4 |
| M2-F08 | Recurring booking form (RRULE builder) | P3 | `[ ]` | 4 |
| M2-F09 | Zod validation schemas for booking forms | P1 | `[ ]` | 2 |
| M2-F10 | Empty states, loading skeletons, error handling | P2 | `[ ]` | 4 |

---

## Member 3 — Maintenance & Ticketing

### Backend

| # | Task | Priority | Status | Sprint |
|---|------|----------|--------|--------|
| M3-B01 | Create `Ticket` JPA entity | P0 | `[ ]` | 1 |
| M3-B02 | Create `TicketAttachment`, `TicketComment`, `TicketStatusHistory` entities | P0 | `[ ]` | 1 |
| M3-B03 | Create all ticket repositories with filtering queries | P0 | `[ ]` | 3 |
| M3-B04 | `TicketService` — create ticket + notify admins | P0 | `[ ]` | 3 |
| M3-B05 | `TicketService` — assign technician (admin) + notify tech + log history | P0 | `[ ]` | 3 |
| M3-B06 | `TicketService` — update status with transition validation + history logging | P0 | `[ ]` | 3 |
| M3-B07 | `TicketService` — list by role (reporter's tickets, tech's tickets, all for admin) | P0 | `[ ]` | 3 |
| M3-B08 | `TicketService` — add comment + notify other party | P0 | `[ ]` | 3 |
| M3-B09 | File upload endpoint for ticket attachments (multipart) | P1 | `[ ]` | 3 |
| M3-B10 | Ticket state machine: validate allowed transitions | P0 | `[ ]` | 3 |
| M3-B11 | `TicketController` — all REST endpoints | P0 | `[ ]` | 3 |
| M3-B12 | `@PreAuthorize` + BOLA checks on all endpoints | P0 | `[ ]` | 3 |
| M3-B13 | Unit tests for `TicketService` (especially state transitions) | P1 | `[ ]` | 3 |
| M3-B14 | Integration tests for `TicketController` | P1 | `[ ]` | 5 |

### Frontend

| # | Task | Priority | Status | Sprint |
|---|------|----------|--------|--------|
| M3-F01 | `TicketListPage` — filterable table (status, priority, category) | P0 | `[ ]` | 3 |
| M3-F02 | `useTickets` hook — TanStack Query wrapper | P0 | `[ ]` | 3 |
| M3-F03 | `TicketForm` — create ticket from resource detail page | P0 | `[ ]` | 3 |
| M3-F04 | `TicketDetailPage` — full info, comment thread, status timeline, attachments | P0 | `[ ]` | 3 |
| M3-F05 | `TicketCommentThread` — threaded comments with auto-scroll | P1 | `[ ]` | 3 |
| M3-F06 | `TicketAssignDialog` — admin assigns technician + due date | P0 | `[ ]` | 3 |
| M3-F07 | File upload component for attachments (drag & drop) | P1 | `[ ]` | 3 |
| M3-F08 | Status timeline visualization (vertical stepper) | P2 | `[ ]` | 3 |
| M3-F09 | `TechDashboard` — assigned tickets sorted by priority | P1 | `[ ]` | 4 |
| M3-F10 | Zod schemas + empty/loading/error states | P2 | `[ ]` | 4 |

---

## Member 4 — Authentication, Roles & Notifications

### Backend

| # | Task | Priority | Status | Sprint |
|---|------|----------|--------|--------|
| M4-B01 | Create `User`, `Role`, `UserRole` JPA entities | P0 | `[ ]` | 1 |
| M4-B02 | Create `UserRepository`, `RoleRepository` | P0 | `[ ]` | 1 |
| M4-B03 | `SecurityConfig` — filter chain, CORS, CSRF disable for API, OAuth2 client config | P0 | `[ ]` | 1 |
| M4-B04 | `OAuth2Config` — Google client registration | P0 | `[ ]` | 1 |
| M4-B05 | `CustomOAuth2UserService` — upsert user on Google login, assign default USER role | P0 | `[ ]` | 1 |
| M4-B06 | `JwtTokenProvider` — generate access + refresh tokens (RS256) | P0 | `[ ]` | 1 |
| M4-B07 | `JwtAuthenticationFilter` — validate token, set SecurityContext | P0 | `[ ]` | 1 |
| M4-B08 | `AuthController` — POST `/auth/google`, POST `/auth/refresh`, POST `/auth/logout` | P0 | `[ ]` | 1 |
| M4-B09 | `UserController` — GET `/users`, GET `/users/me`, PATCH roles, PATCH deactivate | P0 | `[ ]` | 1 |
| M4-B10 | `PermissionEvaluator` — load permissions from user's roles for `@PreAuthorize` | P0 | `[ ]` | 1 |
| M4-B11 | Create `Notification` entity + repository | P0 | `[ ]` | 3 |
| M4-B12 | `NotificationService` — create, list by user, mark read, unread count | P0 | `[ ]` | 3 |
| M4-B13 | `NotificationController` — GET list, PATCH read, PATCH read-all, GET unread-count | P0 | `[ ]` | 3 |
| M4-B14 | Integrate `NotificationService.create()` into BookingService and TicketService | P0 | `[ ]` | 3 |
| M4-B15 | `GlobalExceptionHandler` — handle all exception types cleanly | P0 | `[ ]` | 0 |
| M4-B16 | `AuditConfig` — enable JPA auditing for `@CreatedDate` / `@LastModifiedDate` | P1 | `[ ]` | 0 |
| M4-B17 | `CorsConfig` — environment-specific origins | P1 | `[ ]` | 1 |
| M4-B18 | `OpenApiConfig` — SpringDoc configuration with JWT bearer auth scheme | P1 | `[ ]` | 1 |
| M4-B19 | Rate limiting with Bucket4j on auth endpoints | P2 | `[ ]` | 5 |
| M4-B20 | Unit tests for `AuthService`, `JwtTokenProvider` | P1 | `[ ]` | 1 |
| M4-B21 | Integration tests for `AuthController`, `UserController` | P1 | `[ ]` | 5 |

### Frontend

| # | Task | Priority | Status | Sprint |
|---|------|----------|--------|--------|
| M4-F01 | `LoginPage` — Google sign-in button, redirect to OAuth | P0 | `[ ]` | 1 |
| M4-F02 | `OAuthCallback` — handle redirect, exchange code, store tokens | P0 | `[ ]` | 1 |
| M4-F03 | `authStore` (Zustand) — user, tokens, permissions, login/logout actions | P0 | `[ ]` | 1 |
| M4-F04 | `api/client.ts` — ky instance with auth interceptor + refresh logic | P0 | `[ ]` | 0 |
| M4-F05 | `ProtectedRoute` — redirect to login if unauthenticated, check permissions | P0 | `[ ]` | 1 |
| M4-F06 | `AppLayout` — sidebar, header, main content area | P0 | `[ ]` | 0 |
| M4-F07 | `ProfilePage` — view profile, edit name | P2 | `[ ]` | 1 |
| M4-F08 | `NotificationBell` — unread count badge in header | P0 | `[ ]` | 3 |
| M4-F09 | `NotificationList` — dropdown + full page view | P0 | `[ ]` | 3 |
| M4-F10 | `useNotifications` hook — polling unread count every 30s | P1 | `[ ]` | 3 |
| M4-F11 | `AdminDashboard` — pending bookings, open tickets, resource stats widgets | P1 | `[ ]` | 4 |
| M4-F12 | `UserManagementPage` — list users, change roles, deactivate | P0 | `[ ]` | 3 |
| M4-F13 | `RoleEditor` — assign/remove roles dialog | P1 | `[ ]` | 3 |
| M4-F14 | `DashboardPage` — role-based routing (admin → admin dashboard, tech → tech dashboard) | P1 | `[ ]` | 4 |

---

## Shared / Cross-Cutting Tasks

| # | Task | Owner | Priority | Status | Sprint |
|---|------|-------|----------|--------|--------|
| S-01 | `docker-compose.yml` — PostgreSQL 16 + pgAdmin | M4 | P0 | `[ ]` | 0 |
| S-02 | Configure `application.properties` (datasource, OAuth, JWT) | M4 | P0 | `[ ]` | 0 |
| S-03 | Set up Tailwind 4 + Shadcn/ui in frontend | M2 | P0 | `[ ]` | 0 |
| S-04 | TanStack Router setup with file-based routes | M2 | P0 | `[ ]` | 0 |
| S-05 | `DataTable` shared component (TanStack Table wrapper) | M3 | P1 | `[ ]` | 1 |
| S-06 | `StatusBadge` component (booking + ticket statuses) | M3 | P2 | `[ ]` | 1 |
| S-07 | `ConfirmDialog` component | M2 | P2 | `[ ]` | 1 |
| S-08 | `EmptyState`, `LoadingSpinner` shared components | M1 | P2 | `[ ]` | 1 |
| S-09 | `lib/permissions.ts` — `hasPermission()`, `canApproveBooking()` helpers | M4 | P1 | `[ ]` | 1 |
| S-10 | `lib/validators.ts` — shared Zod schemas | ALL | P1 | `[ ]` | 2 |
| S-11 | `types/api.ts` — TypeScript types mirroring backend DTOs | ALL | P0 | `[ ]` | 1 |
| S-12 | `types/enums.ts` — ResourceType, BookingStatus, etc. as const objects | ALL | P0 | `[ ]` | 1 |
| S-13 | Responsive design pass | ALL | P2 | `[ ]` | 4 |
| S-14 | Accessibility audit | ALL | P2 | `[ ]` | 4 |
| S-15 | E2E tests with Playwright (login, book, create ticket) | M2+M3 | P1 | `[ ]` | 5 |
| S-16 | Final README with setup instructions | ALL | P1 | `[ ]` | 5 |
| S-17 | Demo preparation | ALL | P1 | `[ ]` | 5 |

---

## Summary Counts

| Member | Backend Tasks | Frontend Tasks | Total |
|--------|-------------|----------------|-------|
| Member 1 | 18 | 10 | 28 |
| Member 2 | 15 | 10 | 25 |
| Member 3 | 14 | 10 | 24 |
| Member 4 | 21 | 14 | 35 |
| Shared | — | — | 17 |
| **Total** | **68** | **44** | **129** |
