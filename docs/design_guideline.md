# Design Guidelines

> Smart Campus Resource Management Platform  
> Last updated: 2026-03-04

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (SPA)                      │
│  React 19 · TanStack Router · TanStack Query v5     │
│  Tailwind CSS 4 · Shadcn/ui · Zustand               │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS / JSON
                        ▼
┌─────────────────────────────────────────────────────┐
│               API GATEWAY / BACKEND                  │
│  Spring Boot 4.1 · Spring Security 7 (OAuth 2.0)    │
│  Spring Data JPA (Hibernate 7) · Java 21             │
└───────────────────────┬─────────────────────────────┘
                        │ JDBC
                        ▼
┌─────────────────────────────────────────────────────┐
│                  PostgreSQL 16+                       │
│  UUID PKs · ENUM types · btree_gist exclusions       │
└─────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack (as of 2026-03-04)

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Java | 21 (LTS) | Language runtime |
| Framework | Spring Boot | 4.1.x | Application framework |
| ORM | Hibernate | 7.x (via Spring Data JPA) | Database mapping |
| Security | Spring Security | 7.x | OAuth 2.0, RBAC |
| OAuth Client | `spring-boot-starter-oauth2-client` | — | Google sign-in |
| JWT | `nimbus-jose-jwt` 10.x | — | Stateless token auth |
| Validation | Jakarta Validation 3.1 | — | `@Valid` annotations |
| API Docs | SpringDoc OpenAPI | 3.x | Swagger UI auto-gen |
| Database | PostgreSQL | 16+ | Primary data store |
| Migration | Flyway | 11.x | Schema versioning |
| Build | Maven | 3.9+ | Dependency management |
| Testing | JUnit 5 + Testcontainers | — | Integration tests with real PG |

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| UI Framework | React | 19.x | Component model |
| Language | TypeScript | 5.9+ | Type safety |
| Build | Vite | 7.x | HMR + bundling |
| Compiler | SWC | (via `@vitejs/plugin-react-swc`) | Fast JSX transform |
| Routing | TanStack Router | 1.x | Type-safe file-based routing |
| Data Fetching | TanStack Query | 5.x | Cache + server state |
| Forms | React Hook Form | 7.x + Zod 3.x | Validation |
| State | Zustand | 5.x | Lightweight global state |
| UI Kit | Shadcn/ui | latest | Radix-based components |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Icons | Lucide React | latest | SVG icon library |
| Date | date-fns | 4.x | Date utilities |
| HTTP | ky | 1.x | Tiny fetch wrapper |
| Toast | Sonner | 2.x | Notifications UI |
| Tables | TanStack Table | 8.x | Headless table logic |

---

## 3. Design Principles

### 3.1 Backend

1. **Layered Architecture** — Controller → Service → Repository. No business logic in controllers.
2. **DTO Separation** — Never expose JPA entities directly. Use `record`-based DTOs (Java 21 records).
3. **Fail Fast** — Use `@Valid` on request bodies; `@ControllerAdvice` for global error handling.
4. **Immutable Responses** — All response DTOs are Java records (immutable by default).
5. **Permission-based Auth** — Check permissions via `@PreAuthorize("hasAuthority('APPROVE_BOOKINGS')")`, not just roles.
6. **Pagination** — All list endpoints return `Page<T>` using Spring's `Pageable`.
7. **Idempotency** — PUT endpoints are idempotent; POST for creation only.
8. **Audit Trail** — `created_at` / `updated_at` on all mutable entities; `ticket_status_history` for tickets.

### 3.2 Frontend

1. **Component Hierarchy** — Pages → Layouts → Features → UI Primitives (Shadcn).
2. **Co-location** — Each feature folder contains its components, hooks, types, and API calls.
3. **Server State ≠ Client State** — TanStack Query for server data; Zustand only for truly local state (theme, sidebar open).
4. **Optimistic Updates** — Use `useMutation` + `onMutate` for instant UI feedback on bookings / tickets.
5. **Type Safety End-to-End** — Share API types via a `types/api.ts` barrel file mirroring backend DTOs.
6. **Error Boundaries** — Wrap each route in React error boundaries with fallback UI.
7. **Lazy Loading** — Route-based code splitting via TanStack Router's `lazy()`.
8. **Accessible** — All Shadcn components are Radix-based (WAI-ARIA compliant). Use semantic HTML.

---

## 4. Coding Conventions

### 4.1 Java / Spring

```
Naming:
  Classes        → PascalCase      (BookingService, ResourceController)
  Methods        → camelCase       (findByResourceId)
  Constants      → UPPER_SNAKE     (MAX_BOOKING_DAYS_AHEAD)
  Packages       → lowercase       (com.smartcampus.backend.service)
  DTOs           → <Entity>Request / <Entity>Response records
  Repositories   → <Entity>Repository extends JpaRepository

Layered Architecture Package Layout:
  com.smartcampus.backend.config/        — @Configuration classes
  com.smartcampus.backend.security/      — JWT, OAuth, filters
  com.smartcampus.backend.exception/     — @ControllerAdvice, custom exceptions
  com.smartcampus.backend.model/         — @Entity JPA classes
  com.smartcampus.backend.model.enums/   — Java enums matching PG ENUMs
  com.smartcampus.backend.dto/           — Java record DTOs (sub-packaged by domain)
  com.smartcampus.backend.repository/    — @Repository interfaces
  com.smartcampus.backend.service/       — @Service classes
  com.smartcampus.backend.controller/    — @RestController classes

Naming:
  @RestController classes end with "Controller"
  @Service classes end with "Service" or "ServiceImpl"
  @Repository interfaces end with "Repository"
  Exception classes end with "Exception"
```

### 4.2 TypeScript / React

```
Naming:
  Components     → PascalCase      (BookingCard.tsx)
  Hooks          → camelCase       (useBookings.ts)
  Utils          → camelCase       (formatDate.ts)
  Types/Schemas  → PascalCase      (BookingResponse, bookingSchema)
  Constants      → UPPER_SNAKE     (API_BASE_URL)
  Files          → kebab-case for folders, PascalCase for components

Patterns:
  "use client" not needed (pure SPA, no RSC)
  Prefer `function` for components, arrow functions for callbacks
  Always define prop types inline or via separate `type Props = { ... }`
  Use `as const` for enum-like objects
```

---

## 5. API Design Conventions

- **Base Path:** `/api/v1`
- **Resource naming:** plural nouns (`/resources`, `/bookings`, `/tickets`)
- **HTTP verbs:** GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE
- **Status codes:** 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity
- **Error body:**
  ```json
  {
    "timestamp": "2026-03-04T10:15:30Z",
    "status": 400,
    "error": "Bad Request",
    "message": "End time must be after start time",
    "path": "/api/v1/bookings",
    "fieldErrors": [
      { "field": "endTime", "message": "must be after startTime" }
    ]
  }
  ```
- **Pagination query params:** `?page=0&size=20&sort=createdAt,desc`
- **Filter query params:** `?status=PENDING&type=LAB&fromDate=2026-03-01`

---

## 6. Git Conventions

### Branching Strategy

```
main ← production-ready
  └── develop ← integration branch
        ├── feature/member1-resource-crud
        ├── feature/member2-booking-flow
        ├── feature/member3-ticket-system
        └── feature/member4-auth-notifications
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(booking): add recurring booking support
fix(auth): handle expired OAuth tokens gracefully
docs(schema): update ER diagram
refactor(resource): extract availability validation
test(ticket): add integration tests for assignment flow
chore(deps): bump Spring Boot to 4.1.1
```

---

## 7. UI / UX Guidelines

### Color Palette (Tailwind)

| Role | Color | Tailwind Class |
|------|-------|----------------|
| Primary | Blue-600 | `bg-primary` |
| Success / Approved | Green-600 | `text-green-600` |
| Warning / Pending | Amber-500 | `text-amber-500` |
| Danger / Rejected | Red-600 | `text-red-600` |
| Info / In Progress | Sky-500 | `text-sky-500` |
| Muted | Slate-500 | `text-muted-foreground` |

### Status Badge Mapping

| Status | Badge Color | Icon |
|--------|------------|------|
| PENDING | Amber | `Clock` |
| APPROVED | Green | `CheckCircle` |
| REJECTED | Red | `XCircle` |
| CANCELLED | Slate | `Ban` |
| OPEN | Blue | `AlertCircle` |
| IN_PROGRESS | Sky | `Loader` |
| RESOLVED | Green | `CheckCircle2` |
| CLOSED | Slate | `Archive` |
| CRITICAL | Red | `AlertTriangle` |

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| `sm` | ≥ 640px | Single column |
| `md` | ≥ 768px | Sidebar appears |
| `lg` | ≥ 1024px | Full dashboard grid |
| `xl` | ≥ 1280px | Wide tables |

---

## 8. Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Unit (Java) | JUnit 5 + Mockito | Services: 80%+ |
| Integration (Java) | Testcontainers + Spring Boot Test | Repository + Controller |
| Unit (TS) | Vitest | Utility functions, hooks |
| Component (TS) | Vitest + Testing Library | Key UI components |
| E2E | Playwright | Critical user journeys |
| API Contract | SpringDoc + OpenAPI diff | No breaking changes |
