# Permission Enforcement Map

This document shows where permissions are defined and where they are enforced in both frontend and backend.

Date: 2026-04-14

## 1) Permission Model Overview

Permission flow in this codebase:

1. Role permissions are stored on the backend Role model.
2. User permissions are aggregated from assigned roles.
3. Backend converts permissions to Spring Security authorities.
4. Controllers enforce access with `@PreAuthorize("hasAuthority(...)")`.
5. Services enforce object-level ownership and business-level authorization.
6. Frontend uses the `user.permissions` list for route guards and UI visibility.

Important: frontend checks improve UX, but backend checks are the real security boundary.

## 2) Frontend: Permission Files and Enforcement

### 2.1 Permission constants

- Permission catalog: [frontend/src/lib/permissions.ts#L6](../frontend/src/lib/permissions.ts#L6)
- Permission validator: [frontend/src/lib/permissions.ts#L207](../frontend/src/lib/permissions.ts#L207)
- All permissions helper: [frontend/src/lib/permissions.ts#L211](../frontend/src/lib/permissions.ts#L211)

### 2.2 Runtime permission checks (auth store)

- `hasPermission`: [frontend/src/store/authStore.ts#L51](../frontend/src/store/authStore.ts#L51)
- Core enforcement (`includes`): [frontend/src/store/authStore.ts#L54](../frontend/src/store/authStore.ts#L54)
- `hasAnyPermission`: [frontend/src/store/authStore.ts#L57](../frontend/src/store/authStore.ts#L57)
- `hasAllPermissions`: [frontend/src/store/authStore.ts#L63](../frontend/src/store/authStore.ts#L63)
- `hasRole`: [frontend/src/store/authStore.ts#L69](../frontend/src/store/authStore.ts#L69)
- `isAdmin`: [frontend/src/store/authStore.ts#L75](../frontend/src/store/authStore.ts#L75)

### 2.3 Route-level guards (TanStack Router `beforeLoad`)

- Users route guard: [frontend/src/router.tsx#L100](../frontend/src/router.tsx#L100), [frontend/src/router.tsx#L102](../frontend/src/router.tsx#L102)
- Roles route guard: [frontend/src/router.tsx#L112](../frontend/src/router.tsx#L112), [frontend/src/router.tsx#L114](../frontend/src/router.tsx#L114)
- Locations route guard: [frontend/src/router.tsx#L130](../frontend/src/router.tsx#L130), [frontend/src/router.tsx#L132](../frontend/src/router.tsx#L132)
- Resources route guard: [frontend/src/router.tsx#L142](../frontend/src/router.tsx#L142), [frontend/src/router.tsx#L144](../frontend/src/router.tsx#L144)
- Bookings list route guard: [frontend/src/router.tsx#L154](../frontend/src/router.tsx#L154), [frontend/src/router.tsx#L156](../frontend/src/router.tsx#L156)
- Booking create guard: [frontend/src/router.tsx#L166](../frontend/src/router.tsx#L166), [frontend/src/router.tsx#L168](../frontend/src/router.tsx#L168)
- Booking detail guard (`view_own` OR `view_all`): [frontend/src/router.tsx#L178](../frontend/src/router.tsx#L178), [frontend/src/router.tsx#L180](../frontend/src/router.tsx#L180)
- Admin bookings guard: [frontend/src/router.tsx#L190](../frontend/src/router.tsx#L190), [frontend/src/router.tsx#L192](../frontend/src/router.tsx#L192)
- Tickets list/detail guards (any ticket-view permission):
  - [frontend/src/router.tsx#L202](../frontend/src/router.tsx#L202)
  - [frontend/src/router.tsx#L206](../frontend/src/router.tsx#L206)
  - [frontend/src/router.tsx#L219](../frontend/src/router.tsx#L219)
  - [frontend/src/router.tsx#L223](../frontend/src/router.tsx#L223)
- Ticket create guard: [frontend/src/router.tsx#L236](../frontend/src/router.tsx#L236), [frontend/src/router.tsx#L238](../frontend/src/router.tsx#L238)
- Tech dashboard guard: [frontend/src/router.tsx#L248](../frontend/src/router.tsx#L248), [frontend/src/router.tsx#L251](../frontend/src/router.tsx#L251)

### 2.4 Sidebar/menu visibility enforcement

- Menu items with required permissions: [frontend/src/components/layout/Sidebar.tsx#L26](../frontend/src/components/layout/Sidebar.tsx#L26)
- Filter visible menu items: [frontend/src/components/layout/Sidebar.tsx#L98](../frontend/src/components/layout/Sidebar.tsx#L98)
- OR logic for permission arrays: [frontend/src/components/layout/Sidebar.tsx#L101](../frontend/src/components/layout/Sidebar.tsx#L101)
- Single permission check: [frontend/src/components/layout/Sidebar.tsx#L103](../frontend/src/components/layout/Sidebar.tsx#L103)

### 2.5 Page-level action gating examples

- Role Management:
  - capability flags: [frontend/src/pages/RoleManagementPage.tsx#L48](../frontend/src/pages/RoleManagementPage.tsx#L48)
  - edit action visibility: [frontend/src/pages/RoleManagementPage.tsx#L101](../frontend/src/pages/RoleManagementPage.tsx#L101)
  - delete action visibility: [frontend/src/pages/RoleManagementPage.tsx#L114](../frontend/src/pages/RoleManagementPage.tsx#L114)
  - create button visibility: [frontend/src/pages/RoleManagementPage.tsx#L161](../frontend/src/pages/RoleManagementPage.tsx#L161)

- User Management:
  - capability flags: [frontend/src/pages/UserManagementPage.tsx#L79](../frontend/src/pages/UserManagementPage.tsx#L79)
  - assign roles action: [frontend/src/pages/UserManagementPage.tsx#L160](../frontend/src/pages/UserManagementPage.tsx#L160)
  - deactivate action: [frontend/src/pages/UserManagementPage.tsx#L166](../frontend/src/pages/UserManagementPage.tsx#L166)
  - create user button: [frontend/src/pages/UserManagementPage.tsx#L206](../frontend/src/pages/UserManagementPage.tsx#L206)

- Ticket Detail:
  - capability flags: [frontend/src/pages/TicketDetailPage.tsx#L87](../frontend/src/pages/TicketDetailPage.tsx#L87)
  - delete allowed only for `OPEN`/`REJECTED`: [frontend/src/pages/TicketDetailPage.tsx#L92](../frontend/src/pages/TicketDetailPage.tsx#L92)
  - assign action: [frontend/src/pages/TicketDetailPage.tsx#L153](../frontend/src/pages/TicketDetailPage.tsx#L153)
  - delete action: [frontend/src/pages/TicketDetailPage.tsx#L165](../frontend/src/pages/TicketDetailPage.tsx#L165)
  - comment section access check: [frontend/src/pages/TicketDetailPage.tsx#L321](../frontend/src/pages/TicketDetailPage.tsx#L321)

- Ticket List:
  - create/view capability flags: [frontend/src/pages/TicketListPage.tsx#L104](../frontend/src/pages/TicketListPage.tsx#L104)
  - create button visibility: [frontend/src/pages/TicketListPage.tsx#L238](../frontend/src/pages/TicketListPage.tsx#L238)

## 3) Backend: Permission Files and Enforcement

### 3.1 Security configuration (global)

- Enable method-level security: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L29](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L29)
- HTTP auth rules block: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L51](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L51)
- Any non-public route must be authenticated: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L58](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L58)
- JWT auth filter in chain: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L62](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L62)
- Custom permission evaluator registration: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L73](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L73), [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L75](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L75)

### 3.2 Permission source and authority conversion

- Role permissions storage/parse:
  - [backend/src/main/java/com/smartcampus/backend/model/Role.java#L26](../backend/src/main/java/com/smartcampus/backend/model/Role.java#L26)
  - [backend/src/main/java/com/smartcampus/backend/model/Role.java#L29](../backend/src/main/java/com/smartcampus/backend/model/Role.java#L29)

- User -> permissions in API response:
  - [backend/src/main/java/com/smartcampus/backend/service/UserService.java#L194](../backend/src/main/java/com/smartcampus/backend/service/UserService.java#L194)
  - [backend/src/main/java/com/smartcampus/backend/service/UserService.java#L201](../backend/src/main/java/com/smartcampus/backend/service/UserService.java#L201)
  - [backend/src/main/java/com/smartcampus/backend/dto/auth/UserResponse.java#L13](../backend/src/main/java/com/smartcampus/backend/dto/auth/UserResponse.java#L13)

- User -> authorities used by Spring Security:
  - permissions aggregation: [backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L57](../backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L57)
  - to `SimpleGrantedAuthority`: [backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L43](../backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L43)
  - exposed authorities: [backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L79](../backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L79)

- JWT carries roles and permissions:
  - access token creation: [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L67](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L67)
  - roles claim: [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L77](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L77)
  - permissions claim: [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L78](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L78)

- JWT filter sets authenticated principal:
  - validate token: [backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L38](../backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L38)
  - use principal authorities: [backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L47](../backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L47)
  - set authentication in context: [backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L50](../backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L50)

### 3.3 Controller-level enforcement (`@PreAuthorize`)

#### Users and Roles

- Users controller: [backend/src/main/java/com/smartcampus/backend/controller/UserController.java](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java)
  - `users.create`: [#L33](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L33)
  - `users.read`: [#L40](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L40), [#L60](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L60)
  - `users.manage_roles`: [#L67](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L67)
  - `users.delete_soft`: [#L77](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L77)
  - `roles.read`: [#L87](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L87)

- Roles controller: [backend/src/main/java/com/smartcampus/backend/controller/RoleController.java](../backend/src/main/java/com/smartcampus/backend/controller/RoleController.java)
  - `roles.read`: [#L29](../backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L29)
  - `roles.create`: [#L36](../backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L36)
  - `roles.update`: [#L43](../backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L43)
  - `roles.delete`: [#L52](../backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L52)

#### Locations and Resources

- Locations controller: [backend/src/main/java/com/smartcampus/backend/controller/LocationController.java](../backend/src/main/java/com/smartcampus/backend/controller/LocationController.java)
  - `locations.read`: [#L28](../backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L28), [#L38](../backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L38)
  - `locations.create`: [#L45](../backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L45)
  - `locations.update`: [#L52](../backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L52)
  - `locations.delete`: [#L62](../backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L62)

- Resources controller: [backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java)
  - `resources.read`: [#L32](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L32), [#L49](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L49), [#L91](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L91)
  - `resources.create`: [#L56](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L56)
  - `resources.update`: [#L63](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L63), [#L98](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L98), [#L105](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L105)
  - `resources.update_status`: [#L73](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L73)
  - `resources.delete`: [#L83](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L83), [#L115](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L115)

#### Bookings

- Bookings controller: [backend/src/main/java/com/smartcampus/backend/controller/BookingController.java](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java)
  - `bookings.create`: [#L37](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L37), [#L44](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L44)
  - `bookings.view_own` OR `bookings.view_all`: [#L53](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L53), [#L70](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L70)
  - `bookings.approve`: [#L77](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L77), [#L84](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L84)
  - `bookings.cancel_own` OR `bookings.cancel_any`: [#L94](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L94)
  - availability endpoint mixed access: [#L101](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L101)

#### Tickets

- Tickets controller: [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java)
  - ticket view permissions OR-combined: [#L38](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L38), [#L54](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L54)
  - `tickets.create`: [#L62](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L62), [#L129](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L129), [#L140](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L140)
  - `tickets.assign`: [#L73](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L73)
  - `tickets.update_status` OR `tickets.close`: [#L84](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L84)
  - comment permissions: [#L95](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L95), [#L106](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L106), [#L118](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L118)
  - `tickets.delete`: [#L151](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L151)

#### Notifications

- Notifications controller: [backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java](../backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java)
  - `VIEW_NOTIFICATIONS`: [#L28](../backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L28), [#L39](../backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L39), [#L48](../backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L48), [#L57](../backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L57)

### 3.4 Service-level object/business enforcement

These checks enforce ownership/scope beyond simple endpoint permissions.

- Ticket service scope and object checks:
  - list scope by permission: [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L66](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L66)
  - assignment permission check helper call: [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L159](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L159)
  - per-ticket access check: [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L452](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L452)
  - forbidden when no access: [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L453](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L453)
  - status transition role checks: [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L462](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L462), [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L463](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L463)
  - only admins can close: [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L493](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L493)
  - only tech/admin can resolve: [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L497](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L497)
  - permission resolver helper: [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L532](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L532)

- Booking service scope and ownership checks:
  - `view_all` check for list scoping: [backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L228](../backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L228)
  - effective user scoping: [backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L229](../backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L229)
  - booking detail ownership check: [backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L250](../backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L250)
  - `cancel_any` check: [backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L322](../backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L322)
  - cancel ownership enforcement: [backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L327](../backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L327)

### 3.5 401/403 handling

- `AccessDeniedException` -> 403: [backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L38](../backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L38)
- 403 response build: [backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L41](../backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L41)
- `AuthenticationException` -> 401: [backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L47](../backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L47)
- 401 response build: [backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L50](../backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L50)

## 4) Practical Security Note

- Frontend checks (route/menu/button visibility) are convenience controls.
- Backend checks (`@PreAuthorize` + service ownership checks) are the authoritative enforcement layer.
- Any new sensitive endpoint should include controller-level permission checks and, where needed, service-level ownership/scope checks.
