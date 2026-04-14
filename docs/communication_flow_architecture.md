# Smart Campus App Communication and Layered Architecture

Last updated: 2026-04-14

## 1. Direct Answer to Your Main Question

### Are we using plain REST or Axios?

- Frontend to backend communication is REST over HTTP.
- The frontend is **not** using Axios.
- The frontend HTTP client is **ky** (a lightweight fetch-based client).
- Backend endpoints are Spring `@RestController` REST APIs returning JSON (and multipart for uploads).
- Backend outbound HTTP calls (for Google OAuth exchange/userinfo) use Spring `RestTemplate` via `AuthService`.

### Are we using WebSockets or real-time channels?

- No WebSocket/SSE/RSocket code paths are present in the current codebase.
- Communication is request-response REST only.

## 2. End-to-End Communication Architecture

At runtime, requests move through these major stages:

1. Frontend UI components/pages trigger hooks.
2. Hooks call API modules.
3. API modules call the shared ky client.
4. Browser sends HTTP request to `/api/v1/...` (proxied by Vite in dev).
5. Spring Security filter chain handles auth/authz before controller logic.
6. Controller method receives validated DTO.
7. Service executes business rules and orchestration.
8. Repository executes SQL/JPA calls to PostgreSQL.
9. Data returns from DB to repository -> service -> mapper/DTO -> controller response.
10. Frontend receives JSON, React Query cache updates, UI re-renders.

High-level flow:

```text
Page/Component -> Hook (React Query) -> API module -> ky client
-> HTTP /api/v1/... -> Security filter chain -> @PreAuthorize
-> Controller -> Service -> Repository -> PostgreSQL
-> Repository -> Service -> Mapper/DTO -> Controller ResponseEntity
-> ky client -> Hook success/error handlers -> UI/toast/cache update
```

## 3. Frontend Communication Stack (File-by-File)

### 3.1 Page and Component Layer

Examples:

- `frontend/src/pages/BookingCreatePage.tsx`
- `frontend/src/pages/ResourceManagementPage.tsx`
- `frontend/src/pages/TicketCreatePage.tsx`
- `frontend/src/pages/UserManagementPage.tsx`

Responsibilities:

- Render forms/tables and collect user input.
- Call hook mutation/query functions.
- Handle navigation decisions after success (for example ticket create -> detail page).

### 3.2 Hook Layer (React Query orchestration)

Examples:

- `frontend/src/hooks/useBookings.ts`
- `frontend/src/hooks/useResources.ts`
- `frontend/src/hooks/useLocations.ts`
- `frontend/src/hooks/useUsers.ts`
- `frontend/src/hooks/useRoles.ts`
- `frontend/src/hooks/useTickets.ts`

Responsibilities:

- Executes query/mutation requests.
- Handles optimistic/refresh behavior through query invalidation.
- Converts network errors to UX messages (toast notifications).

### 3.3 API Module Layer (endpoint wrappers)

Examples:

- `frontend/src/api/bookings.ts`
- `frontend/src/api/resources.ts`
- `frontend/src/api/locations.ts`
- `frontend/src/api/users.ts`
- `frontend/src/api/roles.ts`
- `frontend/src/api/tickets.ts`
- `frontend/src/api/auth.ts`

Responsibilities:

- One file per backend domain.
- Defines REST route paths, params, and payload shapes.
- Keeps HTTP details out of page components.

### 3.4 Shared HTTP Client Layer

- `frontend/src/api/client.ts`

Key behavior:

- Uses `ky.create({ prefixUrl: '/api/v1' })`.
- Injects `Authorization: Bearer <accessToken>` in `beforeRequest` hook.
- On `401`, automatically attempts token refresh once (except `/auth/*` requests).
- If refresh fails, clears tokens and redirects to `/login`.
- Stores tokens in localStorage (`smartcampus_access_token_v2`, `smartcampus_refresh_token_v2`).

### 3.5 Dev-time Proxy and Base Paths

- `frontend/vite.config.ts`: `/api` is proxied to `http://localhost:8080`.
- `backend/src/main/resources/application.properties`: context path is `/api/v1`.

Net effect in development:

- Frontend calls relative `/api/v1/...`.
- Vite forwards to backend host/port.

## 4. Backend Request Path Before Reaching DB

This section answers "what happens before DB access" in execution order.

### 4.1 Security Filter Chain Entry

- `backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java`

Applied first:

- CORS policy from `CorsConfig`.
- CSRF disabled (stateless API).
- Session policy stateless.
- Public endpoint whitelist (`/auth/*` selected routes, swagger, actuator, oauth routes, files).
- All other endpoints require authentication.

### 4.2 JWT Authentication Filter

- `backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java`

What it does before controllers:

1. Extracts Bearer token from `Authorization` header.
2. Validates JWT and ignores refresh-token type for normal auth.
3. Extracts userId from token.
4. Loads user+roles from DB using `UserRepository.findByIdWithRoles(...)`.
5. Builds `UserPrincipal` and sets `SecurityContextHolder`.

Important note:

- A DB read can happen here during authentication hydration, even before controller logic starts.

### 4.3 Method Authorization (`@PreAuthorize`)

- Enabled by `@EnableMethodSecurity` in `SecurityConfig`.
- Controllers use permission checks like `hasAuthority('bookings.create')`.
- If denied, request fails with `403` before service logic executes.

### 4.4 Controller Binding and Validation

- Controller receives request and binds DTO (`@RequestBody`, `@RequestPart`, query params).
- Bean validation (`@Valid`) runs.
- Validation failures become `400` via global exception handling.

### 4.5 Service Layer Pre-DB Business Checks

In service methods, more checks happen before writes:

- Ownership checks (`SecurityUtils.getCurrentUserId()`).
- State-machine checks (for ticket/booking statuses).
- Domain validations (time ranges, capacity, recurrence rules, file constraints).
- Permission-sensitive branch logic (view own vs view all, cancel own vs cancel any).

Examples:

- `BookingValidationService` validates date/time/capacity/availability windows.
- `TicketService` validates status transitions, comment ownership, file size/type limits.
- `ResourceService`/`LocationService` validate availability slot semantics.

Only after these checks does the service call repository save/delete operations.

## 5. DB Access and Return Trip Back to Frontend

### 5.1 Repository and Database Layer

Representative repository files:

- `backend/src/main/java/com/smartcampus/backend/repository/UserRepository.java`
- `backend/src/main/java/com/smartcampus/backend/repository/BookingRepository.java`
- `backend/src/main/java/com/smartcampus/backend/repository/TicketRepository.java`
- `backend/src/main/java/com/smartcampus/backend/repository/ResourceRepository.java`
- `backend/src/main/java/com/smartcampus/backend/repository/LocationRepository.java`

Behavior:

- Uses Spring Data JPA plus JPQL/native queries.
- Executes reads/writes against PostgreSQL.
- Some queries eagerly fetch related entities for response composition.

### 5.2 Mapping to API DTOs

- Service maps entities to DTO records before returning.
- Mapping helpers in:
  - `backend/src/main/java/com/smartcampus/backend/mapper/ResourceMapper.java`
  - `backend/src/main/java/com/smartcampus/backend/mapper/TicketMapper.java`

Purpose:

- Prevent leaking entity internals directly.
- Provide stable response shape for frontend types.

### 5.3 Controller Response and Serialization

- Controllers return `ResponseEntity<DTO>` with explicit or default status.
- Spring serializes DTO to JSON.
- Global exceptions are transformed to structured `ApiErrorResponse` JSON.

### 5.4 Frontend Receive and UI Update

1. `ky` resolves or throws HTTPError.
2. Hook `onSuccess` invalidates/updates query cache.
3. Page re-renders with new data.
4. Hook `onError` displays API message via toast.

## 6. Detailed Feature Flows

## 6.1 Login with Email + Password

Execution path:

1. `LoginPage` submits credentials.
2. `authApi.loginWithCredentials(...)` in `frontend/src/api/auth.ts`.
3. `apiClient.post('auth/login')` in `frontend/src/api/client.ts`.
4. `AuthController.loginWithCredentials(...)`.
5. `AuthService.loginWithCredentials(...)`:
   - find user by email
   - password verify
   - active check
   - load roles/permissions
   - generate JWT access + refresh
6. Controller returns `200` + AuthResponse JSON + refresh cookie.
7. Frontend stores tokens and user in auth store.

## 6.2 Create Booking (Protected)

Execution path:

1. `BookingCreatePage` -> `useCreateBooking` -> `bookingsApi.create`.
2. `apiClient` attaches Bearer token.
3. `SecurityConfig` + `JwtAuthenticationFilter` authenticate request.
4. `BookingController.createBooking` (`@PreAuthorize bookings.create`).
5. `BookingService.createBooking`:
   - resolve current user
   - load resource
   - run `BookingValidationService.validateCreate`
   - conflict check (`BookingRepository.existsConflict`)
   - if conflict: throw `BookingConflictException` with suggestions
   - else save booking and create admin notifications
6. `201 Created` with `BookingResponse` or `409 Conflict` with suggestions payload.
7. Frontend mutation `onError` parses API response and shows conflict/suggestion message.

## 6.3 Create Ticket with Attachments (Multipart)

Execution path:

1. `TicketCreatePage` submits `TicketForm` values.
2. `ticketsApi.create` builds `FormData` with JSON part `request` and optional `files` parts.
3. Backend `TicketController.createTicket` (`multipart/form-data`).
4. `TicketService.createTicket`:
   - verify user and resource
   - save ticket
   - for each file: validate and persist metadata + file storage path
   - notify admins
5. `201 Created` with full ticket DTO.

Attachment file serving path:

- Stored under configured upload directory.
- Exposed through `/files/tickets/**` by `FileStorageConfig`.

## 7. Success HTTP Codes (Current API)

### 7.1 Auth

- `POST /auth/register` -> `201`
- `POST /auth/login` -> `200`
- `POST /auth/google` -> `200`
- `POST /auth/refresh` -> `200` (`400` when refresh token missing)
- `POST /auth/logout` -> `204`

### 7.2 Users/Roles

- `POST /users` -> `201`
- `GET /users` -> `200`
- `GET /users/me` -> `200`
- `GET /users/{id}` -> `200`
- `PATCH /users/{id}/roles` -> `200`
- `PATCH /users/{id}/deactivate` -> `204`
- `GET /users/roles` -> `200`
- `GET /roles` -> `200`
- `POST /roles` -> `201`
- `PUT /roles/{id}` -> `200`
- `DELETE /roles/{id}` -> `204`

### 7.3 Locations/Resources

- `GET /locations` -> `200`
- `GET /locations/{id}` -> `200`
- `POST /locations` -> `201`
- `PUT /locations/{id}` -> `200`
- `DELETE /locations/{id}` -> `204`
- `GET /resources` -> `200`
- `GET /resources/{id}` -> `200`
- `POST /resources` -> `201`
- `PUT /resources/{id}` -> `200`
- `PATCH /resources/{id}/status` -> `200`
- `DELETE /resources/{id}` -> `204`
- `GET /resources/tags` -> `200`
- `POST /resources/tags` -> `201`
- `PUT /resources/tags/{id}` -> `200`
- `DELETE /resources/tags/{id}` -> `204`

### 7.4 Bookings

- `POST /bookings` -> `201`
- `POST /bookings/recurring` -> `201`
- `GET /bookings` -> `200`
- `GET /bookings/{id}` -> `200`
- `PATCH /bookings/{id}/approve` -> `200`
- `PATCH /bookings/{id}/reject` -> `200`
- `PATCH /bookings/{id}/cancel` -> `200`
- `GET /bookings/availability` -> `200`

### 7.5 Tickets/Notifications

- `GET /tickets` -> `200`
- `GET /tickets/{id}` -> `200`
- `POST /tickets` -> `201`
- `PATCH /tickets/{id}/assign` -> `200`
- `PATCH /tickets/{id}/status` -> `200`
- `POST /tickets/{id}/comments` -> `201`
- `PUT /tickets/{id}/comments/{commentId}` -> `200`
- `DELETE /tickets/{id}/comments/{commentId}` -> `204`
- `POST /tickets/{id}/attachments` -> `201`
- `DELETE /tickets/{id}/attachments/{attachmentId}` -> `204`
- `DELETE /tickets/{id}` -> `204`
- `GET /notifications` -> `200`
- `GET /notifications/unread-count` -> `200`
- `PATCH /notifications/{id}/read` -> `204`
- `PATCH /notifications/read-all` -> `204`

## 8. Failure HTTP Codes and Where They Come From

Primary source of failure response formatting:

- `backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java`
- Error payload shape: `backend/src/main/java/com/smartcampus/backend/dto/common/ApiErrorResponse.java`

### 8.1 Error Code Matrix

- `400 Bad Request`
  - DTO validation failures (`MethodArgumentNotValidException`)
  - malformed or invalid domain input (for example invalid status transition request fields)
  - specific DB FK issues mapped in exception handler
- `401 Unauthorized`
  - missing/invalid/expired credentials
  - invalid refresh token
  - authentication failures
- `403 Forbidden`
  - permission denied from `@PreAuthorize`
  - ownership checks fail in service
- `404 Not Found`
  - missing entity (`ResourceNotFoundException`)
  - missing static file/resource path
- `409 Conflict`
  - duplicate/conflicting business states (email exists, booking time conflict)
  - constraint conflicts from DB
- `422 Unprocessable Entity`
  - semantic validation errors (availability or capacity constraints)
- `500 Internal Server Error`
  - unhandled unexpected exceptions

### 8.2 Typical Error JSON

```json
{
  "timestamp": "2026-04-14T10:20:30.123Z",
  "status": 409,
  "error": "Conflict",
  "message": "This resource is already booked for the selected time slot",
  "path": "/api/v1/bookings",
  "details": {
    "suggestions": []
  }
}
```

## 9. What "Layered Architecture" Means in This Project

Layered architecture means responsibilities are split into distinct levels, and each level has a focused purpose.

Dependency direction (main backend path):

```text
Controller -> Service -> Repository -> Database
```

Cross-cutting layers:

- Security (`config/security/*`) wraps request before controller.
- Exception handling (`GlobalExceptionHandler`) wraps failures after throw.
- DTO/Mapper layers isolate API contracts from persistence entities.

Benefits:

- Cleaner code ownership.
- Easier testing and debugging.
- Lower coupling between HTTP contracts and DB entities.
- Safer future refactors.

## 10. What Each Backend File Type Is For

### Controller (`controller/*`)

- Defines HTTP routes, request/response status codes, and permission annotations.
- Should stay thin: route + delegation only.

### Service (`service/*`)

- Main business logic layer.
- Performs validation, orchestration, permission-sensitive rules, and transactions.
- Calls repositories and creates notifications/side effects.

### Repository (`repository/*`)

- Data access abstraction.
- Declares JPA/native queries and persistence operations.

### DTO (`dto/*`)

- API contract objects (request and response shapes).
- Used to prevent exposing entity internals directly.

### Model/Entity (`model/*`)

- JPA entity definitions mapped to database tables.
- Contains relationships and persistence metadata.

### Mapper (`mapper/*`)

- Converts entities to DTOs (and vice versa where needed).
- Keeps conversion logic centralized and reusable.

### Security (`config/SecurityConfig`, `security/*`)

- Authentication and authorization pipeline.
- JWT parse/validate + `SecurityContext` population.
- Method-level permission evaluator.

### Exception (`exception/*`)

- Centralized business exceptions with HTTP status.
- Global formatter of all error responses.

### Config (`config/*`)

- CORS, file serving, app beans (`RestTemplate`), OpenAPI, auditing, etc.

## 11. What Each Frontend File Type Is For

### Pages (`pages/*`)

- Screen-level UI and user interaction logic.

### Hooks (`hooks/*`)

- Data fetching/mutations and cache invalidation.
- Usually one hook module per backend domain.

### API modules (`api/*`)

- Route wrapper methods for each backend domain.
- Keep endpoint details out of UI.

### API client (`api/client.ts`)

- Single network gateway with auth token injection and auto refresh.

### Store (`store/authStore.ts`)

- Persisted auth state, permission checks, logout behavior.

### Router (`router.tsx`)

- Frontend route guard checks using permissions before entering pages.

### Types (`types/api.ts`)

- TypeScript contracts mirroring backend DTOs.

## 12. Practical Debug Checklist for Any API Issue

When a request fails, trace in this order:

1. Page -> hook -> API module path correct?
2. `apiClient` sending `Authorization` header?
3. Expired token auto-refresh happened or failed?
4. Backend route is protected by `@PreAuthorize`?
5. Service-level ownership/business rule check failed?
6. Repository query returned empty/conflict?
7. Global exception transformed it to which status code?

This workflow matches the actual runtime architecture in the current codebase.
