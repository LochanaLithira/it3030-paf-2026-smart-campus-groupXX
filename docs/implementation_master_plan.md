# Implementation Master Plan

> Smart Campus Resource Management Platform  
> Last updated: 2026-03-04

---

## 1. Project Timeline (6 Sprints — 6 Weeks)

```
Week 1 ─── Sprint 0: Project Setup & Foundation
Week 2 ─── Sprint 1: Core Entities & Auth
Week 3 ─── Sprint 2: Resource & Booking CRUD
Week 4 ─── Sprint 3: Ticketing & Notifications
Week 5 ─── Sprint 4: Integration, Polish & Edge Cases
Week 6 ─── Sprint 5: Testing, Security Hardening & Deployment
```

---

## 2. Sprint 0 — Project Setup & Foundation (Week 1)

### All Members (collaborative)

| # | Task | Owner |
|---|------|-------|
| 0.1 | Set up Git repo with `main` → `develop` branching strategy | All |
| 0.2 | Configure PostgreSQL 16 locally (Docker Compose recommended) | All |
| 0.3 | Backend: update `pom.xml` with all dependencies (see below) | Member 4 |
| 0.4 | Backend: configure `application.properties` (datasource, OAuth, JWT) | Member 4 |
| 0.5 | Backend: set up Flyway with `V1__initial_schema.sql` from `schema.sql` | Member 1 |
| 0.6 | Backend: create `GlobalExceptionHandler`, `ApiErrorResponse`, base DTOs | All |
| 0.7 | Frontend: install all npm dependencies (see below) | Member 2 |
| 0.8 | Frontend: configure TanStack Router, Tailwind 4, Shadcn/ui | Member 2 |
| 0.9 | Frontend: create `AppLayout`, `Sidebar`, `Header`, `ProtectedRoute` | Member 3 |
| 0.10 | Frontend: set up `api/client.ts` with ky + auth interceptor | Member 4 |
| 0.11 | Create `docker-compose.yml` for PostgreSQL + pgAdmin | Member 4 |
| 0.12 | Document coding conventions and PR review process | All |

### Backend Dependencies to Add (`pom.xml`)

```xml
<!-- Core (already present) -->
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-webmvc
postgresql

<!-- Add these -->
spring-boot-starter-oauth2-client          <!-- Google OAuth 2.0 -->
spring-boot-starter-oauth2-resource-server <!-- JWT validation -->
spring-boot-starter-validation             <!-- Jakarta Bean Validation -->
nimbus-jose-jwt (10.x)                     <!-- JWT creation & parsing -->
springdoc-openapi-starter-webmvc-ui (3.x)  <!-- Swagger UI -->
flyway-core (11.x)                         <!-- DB migrations -->
flyway-database-postgresql                 <!-- PG dialect for Flyway -->
lombok (1.18.x)                            <!-- @Getter, @Builder etc. -->
mapstruct (1.6.x)                          <!-- DTO ↔ Entity mapping -->
mapstruct-processor                        <!-- Annotation processor -->
spring-boot-starter-actuator               <!-- Health + metrics -->

<!-- Test -->
testcontainers (1.20.x)                    <!-- PostgreSQL in tests -->
testcontainers-postgresql
spring-boot-testcontainers
rest-assured (5.x)                         <!-- API integration tests -->
```

### Frontend Dependencies to Add (`package.json`)

```bash
# Routing & data
npm i @tanstack/react-router @tanstack/react-query @tanstack/react-table

# Forms & validation
npm i react-hook-form @hookform/resolvers zod

# State
npm i zustand

# HTTP
npm i ky

# UI
npx shadcn@latest init        # initializes shadcn/ui with Tailwind 4
npm i lucide-react sonner date-fns clsx tailwind-merge

# Dev
npm i -D @tanstack/router-devtools @tanstack/react-query-devtools
npm i -D playwright @playwright/test     # E2E (Sprint 5)
npm i -D vitest @testing-library/react @testing-library/jest-dom
```

---

## 3. Sprint 1 — Core Entities & Auth (Week 2)

### Member 4 — Authentication, Roles, User Management

| # | Task | Backend / Frontend |
|---|------|--------------------|
| 1.1 | Create `User`, `Role`, `UserRole` JPA entities | Backend |
| 1.2 | Create `UserRepository`, `RoleRepository` | Backend |
| 1.3 | Implement `SecurityConfig` (filter chain, CORS, CSRF, OAuth2) | Backend |
| 1.4 | Implement Google OAuth2 login flow (`CustomOAuth2UserService`) | Backend |
| 1.5 | Implement JWT creation, validation (`JwtTokenProvider`, `JwtAuthenticationFilter`) | Backend |
| 1.6 | Create `AuthController` endpoints: `/auth/google`, `/auth/refresh`, `/auth/logout` | Backend |
| 1.7 | Create `UserController`: GET `/users`, GET `/users/me`, PATCH roles, deactivate | Backend |
| 1.8 | Implement permission-based `@PreAuthorize` on all endpoints | Backend |
| 1.9 | Frontend: `LoginPage`, Google sign-in button, `OAuthCallback` handler | Frontend |
| 1.10 | Frontend: `authStore` (Zustand) — user session, token management | Frontend |
| 1.11 | Frontend: `ProtectedRoute` component — redirect to login if unauthenticated | Frontend |
| 1.12 | Frontend: `ProfilePage` (view/edit name, picture) | Frontend |

### Member 1 — Facilities & Assets (entities only)

| # | Task | Backend |
|---|------|---------|
| 1.13 | Create `Location`, `Resource`, `ResourceAvailability`, `ResourceTag`, `ResourceTagMap` entities | Backend |
| 1.14 | Create all repositories with custom query methods | Backend |
| 1.15 | Flyway `V2__seed_roles_and_tags.sql` | Backend |

### Member 2 & 3 — Start entity scaffolding

| # | Task | Backend |
|---|------|---------|
| 1.16 | Create `Booking`, `RecurringBookingGroup` entities | Backend |
| 1.17 | Create `Ticket`, `TicketAttachment`, `TicketComment`, `TicketStatusHistory` entities | Backend |

---

## 4. Sprint 2 — Resource & Booking CRUD (Week 3)

### Member 1 — Facilities & Assets (full CRUD)

| # | Task |
|---|------|
| 2.1 | `ResourceService` — CRUD + filtering (type, status, tags, capacity, search) |
| 2.2 | `LocationService` — CRUD |
| 2.3 | `ResourceController` — all REST endpoints |
| 2.4 | `LocationController` — all REST endpoints |
| 2.5 | Frontend: `ResourceListPage` with filters, search, pagination |
| 2.6 | Frontend: `ResourceDetailPage` with availability grid |
| 2.7 | Frontend: `ResourceForm` (admin create/edit) |
| 2.8 | Frontend: `LocationForm`, `LocationManagementPage` |
| 2.9 | Unit + integration tests for resource service |

### Member 2 — Booking Management

| # | Task |
|---|------|
| 2.10 | `BookingService` — create, cancel, approve, reject, list, availability check |
| 2.11 | `BookingValidationService` — time overlap, capacity, availability window checks |
| 2.12 | `BookingController` — all REST endpoints |
| 2.13 | Frontend: `BookingForm` (date picker, time selector constrained by availability) |
| 2.14 | Frontend: `BookingListPage` ("My Bookings") |
| 2.15 | Frontend: `BookingDetailPage` |
| 2.16 | Frontend: `BookingApprovalQueue` (admin) |
| 2.17 | Recurring bookings: `POST /bookings/recurring` + service logic |
| 2.18 | Unit + integration tests for booking validation |

---

## 5. Sprint 3 — Ticketing & Notifications (Week 4)

### Member 3 — Maintenance & Ticketing

| # | Task |
|---|------|
| 3.1 | `TicketService` — create, assign, update status, list (by role) |
| 3.2 | `TicketController` — all REST endpoints |
| 3.3 | File upload for attachments (local storage or cloud — see security doc) |
| 3.4 | Comment CRUD |
| 3.5 | Status transition validation (allowed state machine) |
| 3.6 | Auto-log `ticket_status_history` on every status change |
| 3.7 | Frontend: `TicketListPage` with filters |
| 3.8 | Frontend: `TicketForm` (create ticket from resource page) |
| 3.9 | Frontend: `TicketDetailPage` with comment thread, attachments, status timeline |
| 3.10 | Frontend: `TicketAssignDialog` (admin) |
| 3.11 | Unit + integration tests |

### Member 4 — Notification System

| # | Task |
|---|------|
| 3.12 | `NotificationService` — create, list (by user), mark read, unread count |
| 3.13 | `NotificationController` — all REST endpoints |
| 3.14 | Integrate notification creation into booking & ticket services |
| 3.15 | Frontend: `NotificationBell` (header badge with unread count) |
| 3.16 | Frontend: `NotificationList` (dropdown + full page) |
| 3.17 | Optional: WebSocket / SSE for real-time notification push |
| 3.18 | Frontend: `AdminDashboard` summary widgets |
| 3.19 | Frontend: `UserManagementPage` + `RoleEditor` |

---

## 6. Sprint 4 — Integration, Polish & Edge Cases (Week 5)

| # | Task | Owner |
|---|------|-------|
| 4.1 | Resource status change → auto-cancel bookings + notify users | M1 + M2 |
| 4.2 | Booking creation → validate against resource availability + status | M2 |
| 4.3 | Ticket resolved → optionally flip resource status back to ACTIVE | M3 + M1 |
| 4.4 | Dashboard widgets: pending bookings count, open tickets, resource stats | M4 |
| 4.5 | TechDashboard: assigned tickets sorted by priority | M3 |
| 4.6 | Global search bar (resources + bookings + tickets) | All |
| 4.7 | Responsive design pass (mobile sidebar, stacked tables) | M2 + M3 |
| 4.8 | Loading states, empty states, error boundaries everywhere | All |
| 4.9 | Optimistic updates for booking cancel, notification mark-read | M2 + M4 |
| 4.10 | Accessibility audit (keyboard nav, screen reader, focus management) | All |

---

## 7. Sprint 5 — Testing, Security & Deployment (Week 6)

| # | Task | Owner |
|---|------|-------|
| 5.1 | Backend integration tests with Testcontainers (real PostgreSQL) | All |
| 5.2 | Frontend unit tests (Vitest) for hooks and utility functions | All |
| 5.3 | E2E tests (Playwright) for critical flows: login, book, create ticket | M2 + M3 |
| 5.4 | Security hardening (see `security_concerns.md`) | M4 |
| 5.5 | Rate limiting on auth endpoints | M4 |
| 5.6 | CORS tightening for production | M4 |
| 5.7 | Environment-specific configs (`application-prod.properties`) | M4 |
| 5.8 | Docker multi-stage build for backend | All |
| 5.9 | Frontend production build + static hosting setup | M2 |
| 5.10 | Final documentation pass: README, API docs, deployment guide | All |
| 5.11 | Demo walkthrough preparation | All |

---

## 8. Dependency Graph Between Members

```
Member 4 (Auth) ─── must be done first ───▶ All others depend on user entities + JWT

Member 1 (Resources) ─── must be done before ───▶ Member 2 (Bookings need resources)
                                                ───▶ Member 3 (Tickets need resources)

Member 2 (Bookings) ◀───▶ Member 4 (Notifications on approval/rejection)

Member 3 (Tickets) ◀───▶ Member 4 (Notifications on assignment/resolution)
```

### Critical Path

```
Sprint 0 → Sprint 1 (Auth + Entities) → Sprint 2 (Resources → Bookings, parallel)
                                       → Sprint 3 (Tickets, Notifications, parallel)
→ Sprint 4 (Integration) → Sprint 5 (Test + Deploy)
```

---

## 9. Definition of Done (per feature)

- [ ] Backend endpoint implemented with proper DTOs, validation, error handling
- [ ] Service layer with business logic, no logic in controllers
- [ ] Repository with custom queries where needed
- [ ] `@PreAuthorize` on controller methods matching permission model
- [ ] Flyway migration if schema changed
- [ ] Frontend page/component implemented with loading/error/empty states
- [ ] TanStack Query hooks for data fetching with proper cache keys
- [ ] Form validation with Zod schema
- [ ] At least 1 unit test per service method
- [ ] At least 1 integration test per controller endpoint
- [ ] PR reviewed by at least 1 other member
- [ ] No TypeScript errors, no ESLint warnings
- [ ] Swagger docs auto-generated and accurate
