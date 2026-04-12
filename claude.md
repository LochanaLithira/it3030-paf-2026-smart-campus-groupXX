# Claude Context — Smart Campus Resource Management Platform

> **Purpose:** This file provides AI assistants (Claude, Copilot, etc.) with complete project context for consistent, accurate code generation.  
> **Date:** 2026-04-07  
> **Last updated by:** GitHub Copilot CLI — Post-PR#3 Code Review: Applied critical fixes for SQL injection vulnerabilities, N+1 query problems, validation gaps, and race conditions. Improved error handling and frontend validation.

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
| Routing | TanStack Router 1.x (code-based, `createRoute`) |
| Server State | TanStack Query 5.x + Devtools |
| Client State | Zustand 5.x with `persist` middleware (`sc-auth` key) |
| Forms | React Hook Form 7.x + Zod 4.x + `@hookform/resolvers` |
| UI Kit | shadcn/ui v4 (base-ui primitives — **not** Radix) |
| Styling | Tailwind CSS 4.x (CSS-first, `@import "tailwindcss"`, oklch vars) |
| HTTP Client | ky 1.x (with JWT Bearer injection + auto-401 refresh interceptor) |
| Tables | TanStack Table 8.x |
| Icons | Lucide React |
| Toasts | Sonner 2.x |
| Dates | date-fns 4.x |
| Testing | Vitest, Testing Library, Playwright |

> **Important UI note:** The project uses **shadcn/ui v4** which is built on **base-ui**, NOT Radix UI.  
> `DropdownMenuTrigger`, `SelectPrimitive`, etc. do **not** support the `asChild` prop.  
> Use `className` directly on the trigger or wrap with a plain `<button>`.

---

## Current Frontend Source Layout

```
frontend/src/
├── api/            HTTP layer: auth.ts, users.ts, roles.ts, notifications.ts, locations.ts, resources.ts
├── components/
│   ├── layout/     AppLayout.tsx, Header.tsx, Sidebar.tsx
│   ├── ui/         All shadcn/ui generated components
│   ├── roles/      RoleEditorDialog.tsx, PermissionSelector.tsx
│   ├── resources/  LocationEditorDialog.tsx, ResourceEditorDialog.tsx
│   └── users/      AssignRolesDialog.tsx, CreateUserDialog.tsx
├── hooks/          useUsers.ts, useRoles.ts, useLocations.ts, useResources.ts
├── lib/            permissions.ts (PERMISSIONS + PERMISSION_GROUPS), utils.ts
├── pages/          DashboardPage.tsx, LoginPage.tsx, UserManagementPage.tsx,
│                   RoleManagementPage.tsx, LocationManagementPage.tsx,
│                   ResourceManagementPage.tsx, ProfilePage.tsx, OAuthCallback.tsx
├── router.tsx      Code-based TanStack Router (createRoute / createRootRoute)
├── store/          authStore.ts (Zustand, persisted)
└── types/          api.ts (mirrors all backend DTOs)
```

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
- API calls: in `src/api/<domain>.ts`, using `ky` client with `api` instance from `src/api/client.ts`
- Data hooks: in `src/hooks/use<Domain>.ts`, wrapping TanStack Query's `useQuery`/`useMutation`
- Form validation: Zod schemas co-located in the component or page file
- Types: mirrored from backend DTOs in `src/types/api.ts`
- State: server state via TanStack Query only; Zustand for client-only state (auth, UI)
- Components: shadcn/ui v4 primitives (base-ui — no `asChild` on triggers)
- Styling: Tailwind CSS 4.x utility classes, `cn()` helper for conditional classes
- Permission checks: `hasPermission(PERMISSIONS.PERMISSION_KEY)` from `src/lib/permissions.ts` via `useAuthStore`
- Routes: code-based in `src/router.tsx` using `createRoute` / `createRootRoute`
- `DropdownMenuTrigger`: pass `className` directly — do NOT use `asChild`
- Select from base-ui: `onValueChange` fires `string | null` — always handle null explicitly

---

## File Paths Quick Reference

```
Backend source:  backend/src/main/java/com/smartcampus/backend/
Backend config:  backend/src/main/resources/
Backend tests:   backend/src/test/java/com/smartcampus/backend/
Frontend source: frontend/src/
Docs:            docs/
Docker:          docker-compose.yml (root), backend/Dockerfile
```

---

## Implementation Status (as of 2026-03-08)

### ✅ Completed — Sprint 0 Foundation

| Task | File(s) |
|------|---------|
| Updated `pom.xml` — Spring Boot 3.4.3, Java 21, all declared deps (OAuth2, JWT, Flyway, Lombok, MapStruct, SpringDoc, Testcontainers, REST Assured) | `backend/pom.xml` |
| Full `application.properties` — datasource, Flyway, OAuth2, JWT, CORS, Swagger, Actuator | `backend/src/main/resources/application.properties` |
| Flyway V1 migration from `schema.sql` — 15 tables, 7 enums, triggers, indexes, seed roles + tags | `backend/src/main/resources/db/migration/V1__initial_schema.sql` |
| Flyway V2 migration — seed data (ADMIN role with all permissions, test user) | `backend/src/main/resources/db/migration/V2__seed_data.sql` |
| Multi-stage `Dockerfile` — build (JDK 21) → extract layers → runtime (JRE 21, non-root user, JVM container-aware flags) | `backend/Dockerfile` |
| `docker-compose.yml` — PostgreSQL 16 + pgAdmin (with pre-configured server) + Backend service; volumes, healthchecks, env-driven config | `docker-compose.yml` |
| `.env.example` — template for all required environment variables | `.env.example` |
| pgAdmin server auto-config | `docker/pgadmin/servers.json` |
| PostgreSQL extension init script | `docker/postgres/init.sql` |

### ✅ Completed — Sprint 1: Auth, Roles & Notifications (Member 4 — Backend)

#### Models & Enums
| Task | File(s) |
|------|---------|
| `User` JPA entity (UUID PK, OAuth2 fields, `is_active`, JPA auditing) | `model/User.java` |
| `Role` JPA entity (`TEXT[]` permissions via `@JdbcTypeCode(SqlTypes.ARRAY)`) | `model/Role.java` |
| `UserRole` JPA entity with `@IdClass(UserRoleId.class)` composite PK | `model/UserRole.java`, `model/UserRoleId.java` |
| `Notification` JPA entity (generic `related_entity_id`, `notification_type` PG enum) | `model/Notification.java` |
| All 6 Java enums mirroring PostgreSQL ENUM types | `model/enums/` |

#### DTOs (Java 21 Records)
| Task | File(s) |
|------|---------|
| `ApiErrorResponse`, `PageResponse<T>` | `dto/common/` |
| `LoginRequest`, `RefreshTokenRequest`, `AuthResponse`, `UserResponse`, `UserSummaryResponse`, `UpdateRolesRequest`, `RoleResponse` | `dto/auth/` |
| `RegisterRequest` — public self-registration (fullName, email, password) | `dto/auth/RegisterRequest.java` |
| `CreateUserRequest` — admin user creation (fullName, email, password, optional roleId) | `dto/auth/CreateUserRequest.java` |
| `CredentialsLoginRequest` — email/password login | `dto/auth/CredentialsLoginRequest.java` |
| `NotificationResponse`, `UnreadCountResponse`, `NotificationPageResponse` | `dto/notification/` |

#### Repositories
| Task | File(s) |
|------|---------|
| `UserRepository` — custom JPQL queries with roles fetch, filtering by search/role/isActive | `repository/UserRepository.java` |
| `RoleRepository`, `UserRoleRepository`, `NotificationRepository` — modifying queries for read/mark-all-read | `repository/` |

#### Security
| Task | File(s) |
|------|---------|
| `UserPrincipal` — implements `UserDetails` + `OAuth2User`, built from `User` entity | `security/UserPrincipal.java` |
| `JwtTokenProvider` — RS256 via nimbus-jose-jwt; auto-generates ephemeral RSA key pair in dev; access (15 min) + refresh (7 day) JWT generation/validation | `security/JwtTokenProvider.java` |
| `JwtAuthenticationFilter` — `OncePerRequestFilter`; extracts Bearer token, validates, populates `SecurityContextHolder` | `security/JwtAuthenticationFilter.java` |
| `CustomOAuth2UserService` — extends `DefaultOAuth2UserService`; upserts user on Google login; assigns default USER role to new users | `security/CustomOAuth2UserService.java` |
| `CustomPermissionEvaluator` — enables `@PreAuthorize("hasAuthority('PERMISSION_NAME')")` with flat permission strings | `security/CustomPermissionEvaluator.java` |
| `SecurityUtils` — static helpers `getCurrentPrincipal()` / `getCurrentUserId()` | `security/SecurityUtils.java` |

#### Configuration
| Task | File(s) |
|------|---------|
| `SecurityConfig` — stateless JWT filter chain, CORS, CSRF disabled, OAuth2 login, method security. Public: `POST /auth/google`, `/auth/refresh`, `/auth/login`, `/auth/register` | `config/SecurityConfig.java` |
| `AuditConfig` — `@EnableJpaAuditing`, `AuditorAware` from SecurityContext | `config/AuditConfig.java` |
| `CorsConfig` — environment-driven `corsConfigurationSource` | `config/CorsConfig.java` |
| `OpenApiConfig` — SpringDoc with global JWT Bearer security scheme | `config/OpenApiConfig.java` |
| `AppConfig` — `RestTemplate` + `PasswordEncoder` (BCrypt) beans | `config/AppConfig.java` |
| `GlobalExceptionHandler` — handles `AppException`, `AccessDeniedException`, `MethodArgumentNotValidException`, `DataIntegrityViolationException` | `exception/GlobalExceptionHandler.java` |
| Custom exceptions: `AppException`, `ResourceNotFoundException`, `UnauthorizedException`, `ConflictException`, `ForbiddenException` | `exception/` |

#### Services
| Task | File(s) |
|------|---------|
| `AuthService` — Google OAuth SPA flow; email/password login (`loginWithCredentials`); public registration (`register` — no role assigned); JWT generation/refresh/logout | `service/AuthService.java` |
| `UserService` — list with filters/pagination, get by ID, get current user, update roles, deactivate, **admin create user with optional role** (`createUser`) | `service/UserService.java` |
| `NotificationService` — create, list (paginated + isRead filter), unread count, markAsRead, markAllAsRead | `service/NotificationService.java` |

#### Controllers
| Task | File(s) |
|------|---------|
| `AuthController` — `POST /auth/google`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/login`, `POST /auth/register` | `controller/AuthController.java` |
| `UserController` — `GET /users`, `GET /users/me`, `GET /users/{id}`, `PATCH /users/{id}/roles`, `PATCH /users/{id}/deactivate`, `POST /users` (admin create) | `controller/UserController.java` |
| `RoleController` — `GET /roles`, `POST /roles`, `PUT /roles/{id}`, `DELETE /roles/{id}` | `controller/RoleController.java` |
| `NotificationController` — `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` | `controller/NotificationController.java` |

### ✅ Completed — Sprint 1: Frontend (Member 4)

#### Infrastructure
| File | Purpose |
|------|---------|
| `src/api/client.ts` | ky instance with JWT Bearer injection + auto-401 refresh |
| `src/api/auth.ts` | `authApi` — google, loginWithCredentials, register, refresh, logout |
| `src/api/users.ts` | `usersApi` — list, getById, me, updateRoles, deactivate, create |
| `src/api/roles.ts` | `rolesApi` — list, create, update, delete |
| `src/api/notifications.ts` | `notificationsApi` — list, unreadCount, markRead, markAllRead |
| `src/store/authStore.ts` | Zustand store (persisted, `sc-auth` key) — user, tokens, login, logout, hasPermission, isAdmin |
| `src/types/api.ts` | All TypeScript interfaces mirroring backend DTOs |
| `src/lib/permissions.ts` | `PERMISSIONS` const, `PERMISSION_GROUPS` (2 groups: user-management + roles), `ALL_PERMISSIONS` |
| `src/router.tsx` | Code-based TanStack Router — all routes, `beforeLoad` permission guards |
| `src/main.tsx` | App entry — QueryClientProvider, RouterProvider, Toaster |

#### Pages
| Page | Route | Notes |
|------|-------|-------|
| `LoginPage.tsx` | `/login` | 3 tabs: Sign In (credentials), Sign Up (self-register → no role), Google OAuth |
| `DashboardPage.tsx` | `/dashboard` | Shows yellow "Contact admin" Alert when user has no roles |
| `UserManagementPage.tsx` | `/users` | TanStack Table, search, pagination, deactivate, assign roles, **Create User button** |
| `RoleManagementPage.tsx` | `/roles` | Roles table, create/edit/delete with permission selector |
| `ProfilePage.tsx` | `/profile` | Current user profile display |
| `OAuthCallback.tsx` | `/oauth/callback` | Exchanges OAuth code, redirects to dashboard |

#### Components (non-UI)
| Component | Purpose |
|-----------|---------|
| `components/layout/AppLayout.tsx` | Sidebar + Header shell |
| `components/layout/Header.tsx` | Visible "Sign out" button + avatar dropdown |
| `components/layout/Sidebar.tsx` | Permission-gated nav links |
| `components/users/AssignRolesDialog.tsx` | Assign roles to existing user |
| `components/users/CreateUserDialog.tsx` | Admin creates user with fullName/email/password + optional role |
| `components/roles/RoleEditorDialog.tsx` | Create/edit role with permission selector |
| `components/roles/PermissionSelector.tsx` | Grouped checkbox permission selector |

---

### ✅ Completed — Sprint 2: Facilities & Assets MVP (Member 1)

#### Backend
| Task | File(s) |
|------|---------|
| Facilities entities (`Location`, `Resource`, `ResourceAvailability`, `ResourceTag`, `ResourceTagMap`) | `model/Location.java`, `model/Resource.java`, `model/ResourceAvailability.java`, `model/ResourceTag.java`, `model/ResourceTagMap.java`, `model/ResourceTagMapId.java` |
| Facilities repositories + filtered resource listing/detail loading | `repository/LocationRepository.java`, `repository/ResourceRepository.java`, `repository/ResourceAvailabilityRepository.java`, `repository/ResourceTagRepository.java`, `repository/ResourceTagMapRepository.java` |
| Facilities DTOs + MapStruct mapper | `dto/resource/*`, `mapper/ResourceMapper.java` |
| Facilities business services | `service/LocationService.java`, `service/ResourceService.java` |
| Facilities controllers with permission guards | `controller/LocationController.java`, `controller/ResourceController.java` |
| Permissions migration for facilities endpoints | `backend/src/main/resources/db/migration/V3__add_facilities_permissions.sql` |

#### Frontend
| Task | File(s) |
|------|---------|
| Facilities API client layer | `src/api/locations.ts`, `src/api/resources.ts` |
| Facilities query hooks | `src/hooks/useLocations.ts`, `src/hooks/useResources.ts` |
| Facilities pages + forms | `src/pages/LocationManagementPage.tsx`, `src/pages/ResourceManagementPage.tsx`, `src/components/resources/LocationEditorDialog.tsx`, `src/components/resources/ResourceEditorDialog.tsx` |
| Router/sidebar/permission wiring | `src/router.tsx`, `src/components/layout/Sidebar.tsx`, `src/lib/permissions.ts`, `src/types/api.ts` |

---

### ⏳ Remaining — Sprint 2+ (Other Members)

| Domain | Status | Key classes to create |
|--------|--------|-----------------------|
| Member 1 — Facilities & Assets | MVP complete (integration + tests pending) | Sprint 4: booking/ticket integration hooks; Sprint 5: unit/integration tests |
| Member 2 — Booking Management | Not started | `Booking`, `RecurringBookingGroup` entities; `BookingService`, `BookingValidationService`; `BookingController` |
| Member 3 — Ticketing | Not started | `Ticket`, `TicketAttachment`, `TicketComment`, `TicketStatusHistory` entities; `TicketService`; `TicketController` |
| All — Frontend (M1/M2/M3 domains) | Not started | Resource pages, Booking pages, Ticket pages — see `tasks.md` |
| All — Integration tests | Not started | Testcontainers + REST Assured integration tests for all controllers |

### Integration Points (for Sprint 2/3)

When implementing `BookingService` and `TicketService`, call `NotificationService.create()` to send notifications:

```java
notificationService.create(
    booking.getUserId(),
    "Booking Approved",
    "Your booking for " + resource.getName() + " has been approved.",
    NotificationType.BOOKING_APPROVED,
    booking.getBookingId()
);
```

### Running the Full Stack

```bash
# Stop conflicting local postgres
sudo systemctl stop postgresql

# Copy and fill in env files
cp .env.example .env                      # set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
cp frontend/.env.example frontend/.env   # set VITE_GOOGLE_CLIENT_ID

# Build and start backend + postgres
docker compose up --build

# In a separate terminal — start frontend dev server
cd frontend && npm install && npm run dev
```

Access points:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/api/v1/swagger-ui.html`
- pgAdmin: `http://localhost:5050` (admin@smartcampus.local / admin)
- PostgreSQL: `localhost:5432` (smartcampus / smartcampus)

