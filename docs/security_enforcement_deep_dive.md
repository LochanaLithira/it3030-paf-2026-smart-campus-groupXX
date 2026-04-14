# Security Enforcement Deep Dive

## 1. Scope
This document explains how security is currently enforced across the Smart Campus app, with explicit references to implementation lines.

Coverage includes:
- Authentication entry points (register, login, OAuth login, refresh, logout)
- JWT access token and refresh token lifecycle
- Backend enforcement layers (filter chain, method security, service-level ownership checks)
- Frontend enforcement layers (token handling, route guards, permission checks)
- Existing security documentation in this repository
- Gaps and hardening items (what is currently missing or weak)

## 2. Security Documents Already in This Repository
The project already has several security-relevant docs. This deep dive complements them with stricter code-level tracing.

| Document | Focus |
|---|---|
| [docs/security_concerns.md](security_concerns.md) | Threat model and security recommendations |
| [docs/permissions_enforcement_map.md](permissions_enforcement_map.md) | Permission mapping (frontend + backend) |
| [docs/communication_flow_architecture.md](communication_flow_architecture.md) | Request flow architecture, including auth path |
| [docs/TROUBLESHOOTING_403_FORBIDDEN.md](TROUBLESHOOTING_403_FORBIDDEN.md) | Permission/token troubleshooting |
| [docs/api_doc.md](api_doc.md) | API contract and status behavior |
| [docs/user-journeys.md](user-journeys.md) | User-level login/use journeys |
| [docs/data_model.md](data_model.md) | Data model including auth/role fields |

## 3. Security Methods and Components Used

### 3.1 Framework and Library Methods
- Spring Security: [backend/pom.xml#L44](../backend/pom.xml#L44)
- Spring OAuth2 Client: [backend/pom.xml#L58](../backend/pom.xml#L58)
- Spring OAuth2 Resource Server: [backend/pom.xml#L62](../backend/pom.xml#L62)
- Nimbus JOSE JWT (RS256 signing/verification): [backend/pom.xml#L66](../backend/pom.xml#L66), [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L137](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L137)
- BCrypt password hashing: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L68](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L68), [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L74](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L74), [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L98](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L98)

### 3.2 Runtime Security Boundary (Backend)
- Method security is enabled globally: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L29](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L29)
- CORS applied via custom source: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L44](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L44), [backend/src/main/java/com/smartcampus/backend/config/CorsConfig.java#L20](../backend/src/main/java/com/smartcampus/backend/config/CorsConfig.java#L20)
- CSRF disabled (stateless API posture): [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L45](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L45)
- Stateless session policy: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L47](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L47)
- Unauthorized requests return 401 (no redirect): [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L50](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L50)
- Public endpoint allowlist: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L53](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L53)
- All other requests require authentication: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L58](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L58)
- JWT filter inserted before username/password filter: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L62](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L62)

### 3.3 Permission Source and Authority Materialization
- DB role permissions stored in `roles.permissions` (`TEXT[]`): [backend/src/main/resources/db/migration/V1__initial_schema.sql#L61](../backend/src/main/resources/db/migration/V1__initial_schema.sql#L61)
- Role permission seed and updates via migrations: [backend/src/main/resources/db/migration/V2__seed_roles_and_admin.sql#L9](../backend/src/main/resources/db/migration/V2__seed_roles_and_admin.sql#L9), [backend/src/main/resources/db/migration/V9__stabilize_role_permissions_for_bookings_and_resources.sql#L8](../backend/src/main/resources/db/migration/V9__stabilize_role_permissions_for_bookings_and_resources.sql#L8)
- User with roles eagerly loaded for auth hydration: [backend/src/main/java/com/smartcampus/backend/repository/UserRepository.java#L48](../backend/src/main/java/com/smartcampus/backend/repository/UserRepository.java#L48)
- `UserPrincipal` aggregates roles/permissions: [backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L49](../backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L49), [backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L55](../backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L55)
- Permissions converted to Spring authorities (`SimpleGrantedAuthority`): [backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L43](../backend/src/main/java/com/smartcampus/backend/security/UserPrincipal.java#L43)
- Custom evaluator wiring for `hasPermission(...)`: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L73](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L73), [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L75](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L75), [backend/src/main/java/com/smartcampus/backend/security/CustomPermissionEvaluator.java#L21](../backend/src/main/java/com/smartcampus/backend/security/CustomPermissionEvaluator.java#L21)

## 4. Authentication and Token Lifecycle (End-to-End)

### 4.1 Register
- Endpoint: `POST /auth/register`: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L29](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L29)
- Input validation (full name/email/password): [backend/src/main/java/com/smartcampus/backend/dto/auth/RegisterRequest.java#L6](../backend/src/main/java/com/smartcampus/backend/dto/auth/RegisterRequest.java#L6)
- Password hashed with BCrypt: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L74](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L74)
- Returns access + refresh tokens in response object: [backend/src/main/java/com/smartcampus/backend/dto/auth/AuthResponse.java#L7](../backend/src/main/java/com/smartcampus/backend/dto/auth/AuthResponse.java#L7)
- Also writes refresh token to HttpOnly cookie: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L36](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L36)

### 4.2 Login (Email + Password)
- Endpoint: `POST /auth/login`: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L47](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L47)
- Input validation: [backend/src/main/java/com/smartcampus/backend/dto/auth/CredentialsLoginRequest.java#L7](../backend/src/main/java/com/smartcampus/backend/dto/auth/CredentialsLoginRequest.java#L7)
- Rejects unknown email/password mismatch: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L90](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L90), [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L102](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L102)
- Prevents password login for OAuth-only accounts (`passwordHash == null`): [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L94](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L94)
- Prevents deactivated users from login: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L105](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L105)
- Issues JWT pair and user claims: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L280](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L280)

### 4.3 Access Token Structure and Validation
- Access token claims include user identity, roles, permissions, and type: [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L75](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L75), [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L77](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L77), [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L78](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L78), [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L79](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L79)
- Signed using RS256: [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L139](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L139)
- Signature verified for every parse: [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L153](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L153)
- Expiration enforced in validation: [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L102](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L102)

### 4.4 JWT Request Authentication
- Reads bearer token from `Authorization` header: [backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L63](../backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L63)
- Rejects refresh tokens for normal request auth: [backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L39](../backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L39)
- Loads user + roles and hydrates security context: [backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L42](../backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L42), [backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L50](../backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L50)

### 4.5 Refresh Token Flow
- Endpoint: `POST /auth/refresh`: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L84](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L84)
- Token accepted from HttpOnly cookie or request body: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L87](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L87), [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L90](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L90)
- Refresh token type check (`typ == REFRESH`) and validity: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L143](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L143)
- Revocation check via invalidated JTI set: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L147](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L147), [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L148](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L148)
- Refresh returns a fresh access+refresh pair: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L280](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L280)

### 4.6 Logout Flow
- Endpoint: `POST /auth/logout`: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L101](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L101)
- Revokes refresh token by adding JTI to invalidation set: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L165](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L165), [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L169](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L169)
- Expires refresh cookie: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L113](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L113)

## 5. Authorization Enforcement

### 5.1 Controller-Level Permission Gates (`@PreAuthorize`)
All sensitive endpoints are guarded at controller entry with explicit permission expressions.

| Endpoint Guard Location | Expression |
|---|---|
| [backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L29](../backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L29) | hasAuthority('roles.read') |
| [backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L36](../backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L36) | hasAuthority('roles.create') |
| [backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L43](../backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L43) | hasAuthority('roles.update') |
| [backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L52](../backend/src/main/java/com/smartcampus/backend/controller/RoleController.java#L52) | hasAuthority('roles.delete') |
| [backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L28](../backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L28) | hasAuthority('locations.read') |
| [backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L38](../backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L38) | hasAuthority('locations.read') |
| [backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L45](../backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L45) | hasAuthority('locations.create') |
| [backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L52](../backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L52) | hasAuthority('locations.update') |
| [backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L62](../backend/src/main/java/com/smartcampus/backend/controller/LocationController.java#L62) | hasAuthority('locations.delete') |
| [backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L37](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L37) | hasAuthority('bookings.create') |
| [backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L44](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L44) | hasAuthority('bookings.create') |
| [backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L53](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L53) | hasAuthority('bookings.view_own') or hasAuthority('bookings.view_all') |
| [backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L70](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L70) | hasAuthority('bookings.view_own') or hasAuthority('bookings.view_all') |
| [backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L77](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L77) | hasAuthority('bookings.approve') |
| [backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L84](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L84) | hasAuthority('bookings.approve') |
| [backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L94](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L94) | hasAuthority('bookings.cancel_own') or hasAuthority('bookings.cancel_any') |
| [backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L101](../backend/src/main/java/com/smartcampus/backend/controller/BookingController.java#L101) | hasAuthority('bookings.create') or hasAuthority('bookings.view_own') or hasAuthority('bookings.view_all') |
| [backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L33](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L33) | hasAuthority('users.create') |
| [backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L40](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L40) | hasAuthority('users.read') |
| [backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L60](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L60) | hasAuthority('users.read') |
| [backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L67](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L67) | hasAuthority('users.manage_roles') |
| [backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L77](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L77) | hasAuthority('users.delete_soft') |
| [backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L87](../backend/src/main/java/com/smartcampus/backend/controller/UserController.java#L87) | hasAuthority('roles.read') |
| [backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L28](../backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L28) | hasAuthority('VIEW_NOTIFICATIONS') |
| [backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L39](../backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L39) | hasAuthority('VIEW_NOTIFICATIONS') |
| [backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L48](../backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L48) | hasAuthority('VIEW_NOTIFICATIONS') |
| [backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L57](../backend/src/main/java/com/smartcampus/backend/controller/NotificationController.java#L57) | hasAuthority('VIEW_NOTIFICATIONS') |
| [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L38](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L38) | hasAuthority('tickets.view_own') or hasAuthority('tickets.view_all') or hasAuthority('tickets.view_assigned') |
| [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L54](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L54) | hasAuthority('tickets.view_own') or hasAuthority('tickets.view_all') or hasAuthority('tickets.view_assigned') |
| [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L62](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L62) | hasAuthority('tickets.create') |
| [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L73](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L73) | hasAuthority('tickets.assign') |
| [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L84](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L84) | hasAuthority('tickets.update_status') or hasAuthority('tickets.close') |
| [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L95](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L95) | hasAuthority('tickets.comment_own') or hasAuthority('tickets.comment_assigned') |
| [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L106](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L106) | hasAuthority('tickets.comment_own') or hasAuthority('tickets.comment_assigned') |
| [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L118](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L118) | hasAuthority('tickets.comment_own') or hasAuthority('tickets.comment_assigned') |
| [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L129](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L129) | hasAuthority('tickets.create') |
| [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L140](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L140) | hasAuthority('tickets.create') |
| [backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L151](../backend/src/main/java/com/smartcampus/backend/controller/TicketController.java#L151) | hasAuthority('tickets.delete') |
| [backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L32](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L32) | hasAuthority('resources.read') |
| [backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L49](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L49) | hasAuthority('resources.read') |
| [backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L56](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L56) | hasAuthority('resources.create') |
| [backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L63](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L63) | hasAuthority('resources.update') |
| [backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L73](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L73) | hasAuthority('resources.update_status') |
| [backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L83](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L83) | hasAuthority('resources.delete') |
| [backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L91](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L91) | hasAuthority('resources.read') |
| [backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L98](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L98) | hasAuthority('resources.update') |
| [backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L105](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L105) | hasAuthority('resources.update') |
| [backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L115](../backend/src/main/java/com/smartcampus/backend/controller/ResourceController.java#L115) | hasAuthority('resources.delete') |

### 5.2 Service-Level Object/Scope Enforcement (BOLA Mitigation)
Controller permissions are not the only layer. Services also enforce ownership and scope:

- Ticket list scope by permission (`view_all`, `view_assigned`, own only): [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L66](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L66), [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L72](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L72)
- Ticket object access check (admin/reporter/assigned tech): [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L442](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L442), [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L453](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L453)
- Comment edit/delete ownership and moderation checks: [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L303](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L303), [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L326](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L326)
- Attachment ownership checks: [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L343](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L343), [backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L399](../backend/src/main/java/com/smartcampus/backend/service/TicketService.java#L399)
- Booking list scoped to caller unless `bookings.view_all`: [backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L228](../backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L228), [backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L229](../backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L229)
- Booking object-level guard for non-admin: [backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L250](../backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L250)
- Booking cancellation owner/admin check: [backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L322](../backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L322), [backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L327](../backend/src/main/java/com/smartcampus/backend/service/BookingService.java#L327)

## 6. Frontend Security Enforcement (UX Layer, Not Trust Boundary)

### 6.1 Token Handling and API Interceptor
- Access and refresh tokens stored in localStorage: [frontend/src/api/client.ts#L12](../frontend/src/api/client.ts#L12), [frontend/src/api/client.ts#L13](../frontend/src/api/client.ts#L13)
- `Authorization: Bearer <access>` injected before requests: [frontend/src/api/client.ts#L63](../frontend/src/api/client.ts#L63)
- On 401, auto-refresh once using singleton promise (prevents stampede): [frontend/src/api/client.ts#L28](../frontend/src/api/client.ts#L28), [frontend/src/api/client.ts#L75](../frontend/src/api/client.ts#L75)
- If refresh fails, clear tokens and force re-login: [frontend/src/api/client.ts#L80](../frontend/src/api/client.ts#L80), [frontend/src/api/client.ts#L81](../frontend/src/api/client.ts#L81)

### 6.2 Route Guards and Permission Guards
- Protected layout requires auth store flag + access token: [frontend/src/router.tsx#L68](../frontend/src/router.tsx#L68), [frontend/src/router.tsx#L72](../frontend/src/router.tsx#L72)
- Permission checks per route (`users`, `roles`, `locations`, `resources`, `bookings`, `tickets`): [frontend/src/router.tsx#L101](../frontend/src/router.tsx#L101), [frontend/src/router.tsx#L113](../frontend/src/router.tsx#L113), [frontend/src/router.tsx#L131](../frontend/src/router.tsx#L131), [frontend/src/router.tsx#L143](../frontend/src/router.tsx#L143), [frontend/src/router.tsx#L155](../frontend/src/router.tsx#L155), [frontend/src/router.tsx#L203](../frontend/src/router.tsx#L203)
- Permission primitives in auth store: [frontend/src/store/authStore.ts#L51](../frontend/src/store/authStore.ts#L51), [frontend/src/store/authStore.ts#L57](../frontend/src/store/authStore.ts#L57), [frontend/src/store/authStore.ts#L63](../frontend/src/store/authStore.ts#L63)

### 6.3 Logout Trigger and Cleanup
- Logout initiated from header UI: [frontend/src/components/layout/Header.tsx#L29](../frontend/src/components/layout/Header.tsx#L29)
- Calls backend logout and always clears local auth state: [frontend/src/store/authStore.ts#L39](../frontend/src/store/authStore.ts#L39), [frontend/src/store/authStore.ts#L47](../frontend/src/store/authStore.ts#L47)
- Backend logout endpoint call in API layer: [frontend/src/api/auth.ts#L45](../frontend/src/api/auth.ts#L45), [frontend/src/api/auth.ts#L48](../frontend/src/api/auth.ts#L48)

## 7. Error/Failure Security Behavior
- 403 mapped for access denied: [backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L38](../backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L38)
- 401 mapped for authentication failures: [backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L47](../backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L47)
- Validation and structured error responses: [backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L57](../backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L57)

## 8. What You Might Have Missed (Security Gaps and Hardening Targets)
These are important findings from the current implementation.

1. Refresh token is still persisted in browser localStorage.
- Evidence: [frontend/src/api/client.ts#L13](../frontend/src/api/client.ts#L13), [frontend/src/api/auth.ts#L17](../frontend/src/api/auth.ts#L17)
- Impact: XSS can steal long-lived refresh token.

2. Refresh cookie security flags are incomplete.
- `Secure` is `false`: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L75](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L75)
- No SameSite set (default browser behavior applies).
- Impact: weaker cookie channel hardening.

3. Refresh cookie path likely does not match API context path.
- Cookie path is `/auth/refresh`: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L39](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L39)
- API context path is `/api/v1`: [backend/src/main/resources/application.properties#L10](../backend/src/main/resources/application.properties#L10)
- Impact: cookie may not be sent to `/api/v1/auth/refresh`; current flow relies on request-body refresh token instead.

4. Refresh-token revocation store is process-local memory only.
- Evidence: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L61](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L61)
- Impact: revoked-token state is lost on restart and not shared across instances.

5. Refresh token rotation does not explicitly revoke old refresh token at refresh time.
- New pair is minted in refresh: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L160](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L160), [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L281](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L281)
- Old token is only revoked on logout: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L165](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L165)

6. `/files/**` is publicly accessible.
- Evidence: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L57](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L57)
- Impact: if sensitive files are stored there, no auth gate applies.

7. Security logging is set to DEBUG in application properties.
- Evidence: [backend/src/main/resources/application.properties#L74](../backend/src/main/resources/application.properties#L74)
- Impact: debug logs can leak metadata if enabled in production.

## 9. Recommended Next Hardening Steps
1. Move refresh token exclusively to HttpOnly + Secure + SameSite cookie and stop storing it in localStorage.
2. Fix refresh cookie path to include context path (or make context-relative handling explicit).
3. Add durable revocation storage (Redis/DB), and implement refresh-token rotation with old-token invalidation on every refresh.
4. Add rate limiting on `/auth/login`, `/auth/google`, `/auth/refresh`, `/auth/logout`.
5. Revisit `/files/**` public access and protect with scoped authorization if files are user-sensitive.
6. Keep Spring Security debug logs off in production profiles.
