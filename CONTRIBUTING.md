# Contributor Guide

> This document is for team members building on top of the existing Member 4 foundation (Auth, Users, Roles, Notifications). Read this before writing any code.

---

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Understanding the Codebase](#understanding-the-codebase)
3. [Adding a Backend Feature](#adding-a-backend-feature)
4. [Adding a Frontend Feature](#adding-a-frontend-feature)
5. [Using Auth & Permissions](#using-auth--permissions)
6. [Sending Notifications](#sending-notifications)
7. [Code Conventions](#code-conventions)
8. [Git Workflow](#git-workflow)
9. [Before Every Pull Request](#before-every-pull-request)
10. [Common Pitfalls](#common-pitfalls)

---

## Development Environment Setup

Follow the [README](./README.md) to get the stack running. Then:

```bash
# Run the database only (faster iteration)
docker compose up postgres -d

# Run the backend locally (hot-reload)
cd backend
./mvnw spring-boot:run

# Run the frontend
cd frontend
npm run dev
```

For backend, your IDE should be IntelliJ IDEA with the Lombok plugin enabled. VS Code with the Extension Pack for Java also works.

---

## Understanding the Codebase

### Architecture — Backend

The backend is **strictly layered**. Every new feature follows this checklist:

```
model/           → JPA @Entity
repository/      → Spring Data JPA interface
service/         → @Service with @Transactional
dto/             → Java 21 records (request + response)
controller/      → @RestController with @PreAuthorize
db/migration/    → Flyway SQL (new VX__ file if schema changes)
```

Never skip a layer. Controllers never call repositories directly. Services never return `@Entity` objects.

### Architecture — Frontend

Each domain has three layers:

```
src/api/<domain>.ts       → ky HTTP calls (no business logic, just fetch)
src/hooks/use<Domain>.ts  → TanStack Query wrappers (useQuery / useMutation)
src/pages/<Domain>Page.tsx → UI component (calls hooks, renders data)
src/components/<domain>/  → Reusable sub-components for that domain
```

---

## Adding a Backend Feature

### Step 1 — Database migration (if schema changes needed)

Create a new file in `backend/src/main/resources/db/migration/`:

```
V3__add_locations.sql    ← next sequential number
```

> Use the EXACT naming format `VX__description.sql`. Never edit existing migrations — they are immutable once committed.

Look at `V1__initial_schema.sql` for examples of table creation, triggers, and enum definitions.

### Step 2 — JPA Entity

Create in `backend/src/main/java/com/smartcampus/backend/model/`:

```java
@Entity
@Table(name = "locations")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Location {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "location_id", updatable = false, nullable = false)
    private UUID locationId;

    @Column(nullable = false, length = 100)
    private String name;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
```

Rules:
- UUID PK everywhere, use `@GeneratedValue(strategy = GenerationType.UUID)`
- All timestamps: `Instant` (never `LocalDateTime`)
- Always use `@EntityListeners(AuditingEntityListener.class)` for `@CreatedDate` / `@LastModifiedDate`
- For PostgreSQL `TEXT[]` columns: add `@JdbcTypeCode(SqlTypes.ARRAY)` on a `List<String>` field
- For PostgreSQL custom enums: add `@Enumerated(EnumType.STRING)` + `@JdbcTypeCode(SqlTypes.NAMED_ENUM)`

### Step 3 — Repository

Create in `backend/src/main/java/com/smartcampus/backend/repository/`:

```java
public interface LocationRepository extends JpaRepository<Location, UUID> {
    // Spring Data derived queries
    List<Location> findByBuildingOrderByNameAsc(String building);

    // Custom JPQL for complex queries
    @Query("SELECT l FROM Location l WHERE LOWER(l.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Location> searchByName(@Param("search") String search, Pageable pageable);
}
```

### Step 4 — DTOs (Java 21 Records)

Create in `backend/src/main/java/com/smartcampus/backend/dto/<domain>/`:

```java
// Request DTO
public record CreateLocationRequest(
    @NotBlank @Size(min = 2, max = 100) String name,
    @NotBlank String building,
    @NotNull @Positive Integer floor
) {}

// Response DTO
public record LocationResponse(
    UUID locationId,
    String name,
    String building,
    Integer floor,
    Instant createdAt
) {}
```

> Never use request DTOs as response DTOs or vice versa. Name them `CreateXxxRequest`, `UpdateXxxRequest`, `XxxResponse`.

### Step 5 — Service

Create in `backend/src/main/java/com/smartcampus/backend/service/`:

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocationService {
    private final LocationRepository locationRepository;

    public Page<LocationResponse> list(Pageable pageable) {
        return locationRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public LocationResponse create(CreateLocationRequest request) {
        Location location = Location.builder()
            .name(request.name())
            .building(request.building())
            .floor(request.floor())
            .build();
        return toResponse(locationRepository.save(location));
    }

    private LocationResponse toResponse(Location l) {
        return new LocationResponse(l.getLocationId(), l.getName(), l.getBuilding(), l.getFloor(), l.getCreatedAt());
    }
}
```

Rules:
- Class-level `@Transactional(readOnly = true)` — override with `@Transactional` on write methods
- Always map to DTO before returning — never return `@Entity` from a service method
- Throw `ResourceNotFoundException` when an entity is not found
- Throw `ConflictException` on duplicate constraint violations

### Step 6 — Controller

Create in `backend/src/main/java/com/smartcampus/backend/controller/`:

```java
@RestController
@RequestMapping("/locations")
@RequiredArgsConstructor
@Tag(name = "Locations", description = "Campus location management")
public class LocationController {
    private final LocationService locationService;

    @GetMapping
    @PreAuthorize("hasAuthority('locations.read')")
    public Page<LocationResponse> list(Pageable pageable) {
        return locationService.list(pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('locations.create')")
    public LocationResponse create(@Valid @RequestBody CreateLocationRequest request) {
        return locationService.create(request);
    }
}
```

Rules:
- Every endpoint **must** have `@PreAuthorize` — no unguarded endpoints except those in `SecurityConfig`
- Use standard HTTP status codes: `200 OK`, `201 Created`, `204 No Content`, `404 Not Found`, `409 Conflict`
- Use `@Valid` on every `@RequestBody`
- Add the permission string to the appropriate role in V2 seed migration if it should be available to existing roles

---

## Adding a Frontend Feature

### Step 1 — Add Types

Open `frontend/src/types/api.ts` and add interfaces mirroring the backend DTOs:

```typescript
export interface LocationResponse {
  locationId: string;
  name: string;
  building: string;
  floor: number;
  createdAt: string;
}

export interface CreateLocationRequest {
  name: string;
  building: string;
  floor: number;
}
```

### Step 2 — Add API Client

Create `frontend/src/api/locations.ts`:

```typescript
import { api } from './client';
import type { LocationResponse, CreateLocationRequest } from '@/types/api';

export const locationsApi = {
  list: () =>
    api.get('locations').json<LocationResponse[]>(),

  create: (request: CreateLocationRequest) =>
    api.post('locations', { json: request }).json<LocationResponse>(),
};
```

### Step 3 — Add Query Hooks

Create `frontend/src/hooks/useLocations.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '@/api/locations';
import { toast } from 'sonner';

export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
};

export function useLocations() {
  return useQuery({
    queryKey: locationKeys.lists(),
    queryFn: locationsApi.list,
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: locationsApi.create,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() });
      toast.success(`Location "${created.name}" created`);
    },
    onError: () => toast.error('Failed to create location'),
  });
}
```

### Step 4 — Add Page Component

Create `frontend/src/pages/LocationManagementPage.tsx`:

```typescript
import { useLocations } from '@/hooks/useLocations';
import { useAuthStore } from '@/store/authStore';
import { PERMISSIONS } from '@/lib/permissions';

export function LocationManagementPage() {
  const { data: locations = [], isLoading } = useLocations();
  const { hasPermission } = useAuthStore();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Locations</h1>
      {/* render table, dialogs, etc. */}
    </div>
  );
}
```

### Step 5 — Register the Route

Open `frontend/src/router.tsx` and add your route following the existing pattern:

```typescript
import { LocationManagementPage } from '@/pages/LocationManagementPage';

const locationsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/locations',
  component: LocationManagementPage,
  beforeLoad: () => {
    const { isAuthenticated, hasPermission } = useAuthStore.getState();
    if (!isAuthenticated) throw redirect({ to: '/login' });
    if (!hasPermission(PERMISSIONS.LOCATIONS_READ)) throw redirect({ to: '/dashboard' });
  },
});

// Add to routeTree:
const routeTree = rootRoute.addChildren([
  loginRoute,
  oauthCallbackRoute,
  protectedLayoutRoute.addChildren([
    dashboardRoute,
    usersRoute,
    rolesRoute,
    profileRoute,
    locationsRoute,   // ← add here
  ]),
]);
```

---

## Using Auth & Permissions

### Backend — protecting endpoints

```java
// In any controller method:
@PreAuthorize("hasAuthority('locations.create')")

// To get the current user's ID in a service:
UUID currentUserId = SecurityUtils.getCurrentUserId();
```

### Frontend — checking permissions in components

```typescript
const { hasPermission, isAdmin, user } = useAuthStore();

// Show button only if user has permission
{hasPermission(PERMISSIONS.LOCATIONS_CREATE) && (
  <Button onClick={() => setCreateOpen(true)}>Add Location</Button>
)}

// Block a whole page
if (!hasPermission(PERMISSIONS.LOCATIONS_READ)) {
  return <Navigate to="/dashboard" />;
}
```

### Adding a new permission

1. Add the string value to `PERMISSIONS` in `frontend/src/lib/permissions.ts`
2. Add it to the appropriate `PERMISSION_GROUPS` entry for the Role Editor UI
3. Add it to the relevant role's permissions array in the V2 seed migration (or a new Vx migration)

---

## Sending Notifications

Call `NotificationService` from any other service when an event worth notifying occurs. It is already wired up and available via constructor injection.

```java
@Service
@RequiredArgsConstructor
public class BookingService {
    private final NotificationService notificationService;

    @Transactional
    public BookingResponse approve(UUID bookingId) {
        // ... business logic ...

        notificationService.create(
            booking.getUserId(),                    // recipient
            "Booking Approved",                     // title
            "Your booking for " + room + " has been approved.",  // message
            NotificationType.BOOKING_APPROVED,      // type enum
            booking.getBookingId()                  // related entity UUID
        );

        return toResponse(booking);
    }
}
```

Available `NotificationType` values: `BOOKING_CREATED`, `BOOKING_APPROVED`, `BOOKING_REJECTED`, `BOOKING_CANCELLED`, `TICKET_CREATED`, `TICKET_ASSIGNED`, `TICKET_UPDATED`, `TICKET_RESOLVED`, `MAINTENANCE_ALERT`, `ROLE_CHANGED`, `GENERAL`.

---

## Code Conventions

### Java

| Rule | Detail |
|------|--------|
| DTOs | Java 21 `record` only — no classes with getters |
| Entities | Lombok `@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor` |
| Timestamps | `Instant` or `OffsetDateTime` — never `LocalDateTime` for DB |
| SQL | Spring Data derived queries or `@Query` with `:namedParams` — never string concatenation |
| Transactions | `@Transactional(readOnly = true)` at class level; `@Transactional` on individual write methods |
| Package | `com.smartcampus.backend.<layer>` — no domain sub-packages |
| Entities in API | Never — always map through a DTO before returning |

### TypeScript / React

| Rule | Detail |
|------|--------|
| Components | Named `function` exports — `export function MyComponent()` |
| API files | One file per domain in `src/api/`, use `api` from `src/api/client.ts` |
| Hooks | One file per domain in `src/hooks/`, co-locate query keys |
| Types | Add to `src/types/api.ts` — mirror backend DTO exactly |
| Forms | `react-hook-form` + zod schema — define schema in the component file |
| Permissions | Always guard with `hasPermission(PERMISSIONS.XXX)` — never hardcode strings |
| `DropdownMenuTrigger` | Do NOT use `asChild` (base-ui, not Radix) — apply `className` directly |
| Select `onValueChange` | Fires `string \| null` — always handle null: `(v) => setValue('field', v ?? '')` |

---

## Git Workflow

```
main            ← stable, deployable
└── dev         ← integration branch
    ├── m1/feature-name
    ├── m2/feature-name
    ├── m3/feature-name
    └── m4/feature-name
```

1. Branch off `dev` — name it `m<N>/short-description` (e.g. `m1/location-api`)
2. Commit small and often — one logical change per commit
3. Before opening a PR, rebase onto latest `dev`
4. PR must pass TypeScript check (`npx tsc --noEmit`) and build
5. Merge only into `dev` — team lead merges `dev` → `main`

### Commit message format

```
feat(locations): add location CRUD endpoints
fix(auth): handle null refresh token cookie
refactor(bookings): extract validation into BookingValidationService
```

---

## Before Every Pull Request

Run these in order and fix everything before pushing:

```bash
# 1. TypeScript — must be zero errors
cd frontend && npx tsc --noEmit

# 2. Backend — must compile and all tests pass
cd backend && ./mvnw verify

# 3. Make sure the full stack starts
docker compose up --build
# Wait for: "Started BackendApplication in X.XXX seconds"
# Then open http://localhost:5173 and verify login works
```

---

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| Flyway migration fails on startup | Edited an existing `VX__` file | Never edit existing migrations — create a new `V(X+1)__` file |
| `asChild` TypeScript error on `DropdownMenuTrigger` | base-ui does not support `asChild` | Remove `asChild`, apply styles directly on `DropdownMenuTrigger` |
| `onValueChange` fires `null` in Select | base-ui fires `string \| null` | Handle null: `(v) => onChange(v ?? '')` |
| 403 on every request | Missing `@PreAuthorize` permission string, or role doesn't have the permission | Check the permission in the `roles.permissions` array; add it via V-migration if needed |
| `LazyInitializationException` | Accessing a lazy-loaded association outside a transaction | Add `@Transactional` to the service method, or use `JOIN FETCH` in the repository query |
| Docker port 5432 conflict | Local PostgreSQL running | `sudo systemctl stop postgresql` |
| Frontend "Cannot find module '@/pages/...'" | VS Code TS language server cache stale | Run `TypeScript: Restart TS Server` from VS Code command palette |
| `tsc --noEmit` shows 0 errors, VS Code shows errors | Same as above | Restart TS server |
| Self-registered user can't access anything | Expected — no role assigned | Admin must assign a role via `/users` → Assign Roles |

---

## Who Owns What

| Domain | Member | Backend package prefix | Frontend pages |
|--------|--------|----------------------|----------------|
| Auth, Users, Roles, Notifications | M4 | `service/AuthService`, `service/UserService` | `LoginPage`, `DashboardPage`, `UserManagementPage`, `RoleManagementPage` |
| Facilities & Assets | M1 | `service/LocationService`, `service/ResourceService` | `ResourceListPage`, `LocationManagementPage` |
| Booking Management | M2 | `service/BookingService`, `service/BookingValidationService` | `BookingPage`, `BookingCalendar` |
| Maintenance & Ticketing | M3 | `service/TicketService` | `TicketListPage`, `TicketDetailPage` |

If you need to cross a domain boundary (e.g. Booking needs to know if a Resource is available), call the other member's **Service** — never their repository directly.
