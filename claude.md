# Claude Context — Smart Campus Resource Management Platform

> **Purpose:** This file provides AI assistants (Claude, Copilot, etc.) with complete project context for consistent, accurate code generation.  
> **Date:** 2026-03-04

---

## Project Identity

- **Name:** Smart Campus Resource Management Platform
- **Repo:** `it3030-paf-2026-smart-campus-groupXX`
- **Type:** Full-stack web application (monorepo: `backend/` + `frontend/`)
- **Team:** 4 members

---

## Tech Stack

### Backend

| Aspect | Technology |
|--------|-----------|
| Language | Java 21 (LTS) |
| Framework | Spring Boot 4.1.x (milestone) |
| ORM | Spring Data JPA (Hibernate 7) |
| Security | Spring Security 7, OAuth 2.0 (Google), JWT (RS256 via nimbus-jose-jwt 10.x) |
| Validation | Jakarta Bean Validation 3.1 (`@Valid`, `@NotNull`, etc.) |
| API Docs | SpringDoc OpenAPI 3.x (Swagger UI) |
| Migration | Flyway 11.x |
| Database | PostgreSQL 16+ (with `pgcrypto`, `btree_gist` extensions) |
| Build | Maven 3.9+ (wrapper: `mvnw`) |
| Testing | JUnit 5, Mockito, Testcontainers, REST Assured 5.x |
| Utilities | Lombok 1.18.x, MapStruct 1.6.x |

### Frontend

| Aspect | Technology |
|--------|-----------|
| UI Framework | React 19.2 |
| Language | TypeScript 5.9+ |
| Build | Vite 7.3 with `@vitejs/plugin-react-swc` |
| Routing | TanStack Router 1.x (file-based) |
| Server State | TanStack Query 5.x |
| Client State | Zustand 5.x |
| Forms | React Hook Form 7.x + Zod 3.x |
| UI Kit | Shadcn/ui (Radix primitives) |
| Styling | Tailwind CSS 4.x |
| HTTP Client | ky 1.x |
| Tables | TanStack Table 8.x |
| Icons | Lucide React |
| Toasts | Sonner 2.x |
| Dates | date-fns 4.x |
| Testing | Vitest, Testing Library, Playwright |

---

## Architecture: Layered (N-Tier)

The backend uses **classic layered architecture** — top-level packages organised **by layer**, not by domain feature.

```
com.smartcampus.backend/
├── config/           @Configuration classes (Security, CORS, JWT, Flyway, Audit, OpenAPI)
├── security/         JWT provider, auth filter, OAuth2 user service, permission evaluator
├── exception/        @ControllerAdvice global handler + custom exceptions
├── model/            @Entity JPA classes (all 15 tables in one package)
│   └── enums/        Java enums mirroring PostgreSQL ENUM types
├── dto/              Java record DTOs, sub-packaged by domain:
│   ├── common/       ApiErrorResponse, PageResponse
│   ├── auth/         LoginRequest, AuthResponse, UserResponse, RoleRequest
│   ├── resource/     ResourceRequest, ResourceResponse, LocationRequest, etc.
│   ├── booking/      BookingRequest, BookingResponse, BookingApprovalRequest, etc.
│   ├── ticket/       TicketRequest, TicketResponse, TicketAssignRequest, etc.
│   └── notification/ NotificationResponse
├── repository/       @Repository interfaces (Spring Data JPA)
├── service/          @Service classes (business logic)
└── controller/       @RestController classes (REST API endpoints)
```

**Key rule:** Each layer depends only on the layer below it (Controller → Service → Repository → Model).

---

## Database Schema (15 Tables)

| Table | Owner | Purpose |
|-------|-------|---------|
| `users` | M4 | OAuth users with optional password_hash |
| `roles` | M4 | ADMIN, USER, TECHNICIAN — with `permissions TEXT[]` (GIN indexed) |
| `user_roles` | M4 | M:N junction (composite PK) |
| `locations` | M1 | Buildings, floors, rooms |
| `resources` | M1 | Lecture halls, labs, meeting rooms, equipment |
| `resource_availability` | M1 | Weekly time windows per resource |
| `resource_tags` / `resource_tag_map` | M1 | Tag vocabulary + M:N mapping |
| `bookings` | M2 | Resource reservations with GiST exclusion constraint |
| `recurring_booking_groups` | M2 | iCal RRULE-based recurrence groups |
| `tickets` | M3 | Maintenance / issue reports |
| `ticket_attachments` | M3 | File uploads on tickets |
| `ticket_comments` | M3 | Discussion thread per ticket |
| `ticket_status_history` | M3 | Audit log of ticket state transitions |
| `notifications` | M4 | In-app notifications for all events |

**7 Custom PostgreSQL ENUMs:** `resource_type`, `resource_status`, `day_of_week`, `booking_status`, `ticket_priority`, `ticket_status`, `notification_type`

**Primary keys:** UUID everywhere (via `gen_random_uuid()`).  
**Timestamps:** `TIMESTAMPTZ` with auto-update trigger (`set_updated_at()`).  
**Double-booking prevention:** `excl_no_double_booking` exclusion constraint using `btree_gist`.

---

## Team Ownership

| Member | Backend Domain | Frontend Domain |
|--------|---------------|-----------------|
| **Member 1** | Facilities & Assets — `Location`, `Resource`, `ResourceAvailability`, `ResourceTag`, `ResourceTagMap` entities, their repos, services, controllers | `features/resources/` pages + forms |
| **Member 2** | Booking Management — `Booking`, `RecurringBookingGroup` entities, `BookingService`, `BookingValidationService`, `BookingController` | `features/bookings/` pages + forms |
| **Member 3** | Maintenance & Ticketing — `Ticket`, `TicketAttachment`, `TicketComment`, `TicketStatusHistory` entities, `TicketService`, `TicketController` | `features/tickets/` pages + forms |
| **Member 4** | Auth, Roles & Notifications — `User`, `Role`, `UserRole`, `Notification` entities, `AuthService`, `UserService`, `NotificationService`, all security/config classes | `features/auth/`, `features/admin/`, `components/notifications/` |

---

## API Conventions

- **Base path:** `/api/v1`
- **Naming:** Plural nouns (`/resources`, `/bookings`, `/tickets`)
- **Auth:** Bearer JWT in `Authorization` header
- **Pagination:** `?page=0&size=20&sort=createdAt,desc` — returns `PageResponse<T>` wrapper
- **Error format:** `{ timestamp, status, error, message, path, fieldErrors[] }`
- **Permission guard:** `@PreAuthorize("hasAuthority('PERMISSION_NAME')")` on every endpoint
- **BOLA defense:** Service methods always verify `entity.getUserId().equals(currentUserId)` or admin permission

---

## Auth Flow

1. Frontend redirects to Google OAuth consent screen
2. Google returns authorization code to `/oauth/callback`
3. Frontend sends code to `POST /api/v1/auth/google`
4. Backend exchanges code server-side, upserts user, returns JWT access + refresh tokens
5. Access token (15 min) stored in memory (Zustand); refresh token (7 days) in HttpOnly cookie
6. `ky` interceptor auto-refreshes on 401

---

## Key Business Rules

- **Bookings:** Must fall within `resource_availability` time windows. Capacity checked against `resource.capacity`. Overlap prevented by PostgreSQL exclusion constraint.
- **Tickets:** State machine with allowed transitions (OPEN → IN_PROGRESS/REJECTED/CLOSED; IN_PROGRESS → RESOLVED/CLOSED; RESOLVED → CLOSED/IN_PROGRESS). Every transition logged in `ticket_status_history`.
- **Notifications:** Created automatically on: booking created/approved/rejected/cancelled, ticket created/assigned/updated/resolved, role changes, maintenance alerts.
- **Permissions:** Array-based (`TEXT[]`), not role-name checks. ADMIN has 14 permissions, USER has 8, TECHNICIAN has 7.

---

## Existing Documentation (docs/)

| File | Description |
|------|-------------|
| `schema.sql` | Full PostgreSQL DDL (353 lines) — 15 tables, 7 enums, triggers, indexes, seed data |
| `data_model.md` | ER diagram, table details, permission catalogue, JPA mapping notes |
| `design_guideline.md` | Tech stack, design principles, coding conventions, API patterns, Git workflow, UI/UX |
| `folder_structure.md` | Complete directory layout (layered backend + feature-based frontend), member ownership |
| `api_doc.md` | Full REST API spec — all endpoints, request/response schemas, status codes |
| `implementation_master_plan.md` | 6-sprint timeline, dependency graph, per-sprint task tables, dependencies to install |
| `security_concerns.md` | OAuth/JWT security, RBAC, injection prevention, file upload, rate limiting, headers |
| `tasks.md` | 129 tasks broken down by member with priorities, sprints, checkboxes |
| `user-journeys.md` | User flows for all 3 roles, route map, notification lifecycle |

---

## Code Generation Rules

When generating code for this project, follow these conventions:

### Java (Backend)
- Use **Java 21 records** for all DTOs (not classes with getters/setters)
- Use **Lombok** `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` on `@Entity` classes
- Use **MapStruct** for entity ↔ DTO mapping
- All timestamps: `Instant` or `OffsetDateTime` (never `LocalDateTime` for DB columns)
- `@Transactional` on service methods that modify data
- Repository methods: prefer Spring Data derived queries or `@Query` with named params (`:paramName`)
- **Never** concatenate strings into SQL
- **Never** return JPA entities from controllers — always map to DTOs
- Enum mapping: `@Enumerated(EnumType.STRING)` + `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` for PG enums
- Array mapping: `@JdbcTypeCode(SqlTypes.ARRAY)` for `TEXT[]` columns
- Package: `com.smartcampus.backend.<layer>`

### TypeScript (Frontend)
- All components: named `function` exports (not arrow-function default exports)
- API calls: in `src/api/<domain>.api.ts`, using `ky` client
- Data hooks: in `src/hooks/use<Domain>.ts`, wrapping TanStack Query's `useQuery`/`useMutation`
- Form validation: Zod schemas in `src/lib/validators.ts`
- Types: mirrored from backend DTOs in `src/types/api.ts`
- State: server state via TanStack Query only; Zustand for client-only state (auth, UI)
- Components: Shadcn/ui primitives, composed in feature components
- Styling: Tailwind CSS utility classes, `cn()` helper for conditional classes
- Permission checks: `hasPermission(user, 'PERMISSION_NAME')` from `src/lib/permissions.ts`
- Routes: file-based in `src/routes/` following TanStack Router conventions

---

## File Paths Quick Reference

```
Backend source:  backend/src/main/java/com/smartcampus/backend/
Backend config:  backend/src/main/resources/
Backend tests:   backend/src/test/java/com/smartcampus/backend/
Frontend source: frontend/src/
Docs:            docs/
```
