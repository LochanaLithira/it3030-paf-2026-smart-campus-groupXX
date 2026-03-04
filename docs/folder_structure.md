# Project Folder Structure

> Smart Campus Resource Management Platform  
> Last updated: 2026-03-04

---

## Root

```
it3030-paf-2026-smart-campus-groupXX/
├── README.md
├── docs/                          # All project documentation
│   ├── schema.sql                 # PostgreSQL DDL
│   ├── data_model.md
│   ├── design_guideline.md
│   ├── folder_structure.md        # ← this file
│   ├── api_doc.md
│   ├── implementation_master_plan.md
│   ├── security_concerns.md
│   ├── tasks.md
│   └── user-journeys.md
├── backend/                       # Spring Boot 4.1 (Java 21)
└── frontend/                      # React 19 + Vite 7 SPA
```

---

## Backend — Spring Boot (Layered Architecture)

> **Pattern:** Classic layered / n-tier architecture.  
> Top-level packages are organised **by layer** (controller → service → repository → model → dto), *not* by domain feature.  
> Each layer depends only on the layer directly below it.

```
┌─────────────────────────────────────────────┐
│  Presentation Layer (controller)            │  ← REST endpoints, @RestController
├─────────────────────────────────────────────┤
│  Business / Service Layer (service)         │  ← @Service, business rules
├─────────────────────────────────────────────┤
│  Persistence Layer (repository)             │  ← @Repository, Spring Data JPA
├─────────────────────────────────────────────┤
│  Domain / Model Layer (model)               │  ← @Entity JPA classes
├─────────────────────────────────────────────┤
│  Data Transfer Layer (dto)                  │  ← Java records (request / response)
├─────────────────────────────────────────────┤
│  Cross-cutting (config, security, exception)│  ← Spring configs, filters, handlers
└─────────────────────────────────────────────┘
```

```
backend/
├── mvnw / mvnw.cmd                           # Maven wrapper
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/smartcampus/backend/
    │   │   ├── BackendApplication.java       # @SpringBootApplication entry point
    │   │   │
    │   │   ├── config/                       # ── Cross-cutting configuration ──
    │   │   │   ├── SecurityConfig.java       # Spring Security 7 filter chain
    │   │   │   ├── OAuth2Config.java         # Google OAuth 2.0 client registration
    │   │   │   ├── JwtConfig.java            # JWT signing key, expiry settings
    │   │   │   ├── CorsConfig.java           # CORS allow-list
    │   │   │   ├── OpenApiConfig.java        # SpringDoc / Swagger UI
    │   │   │   ├── FlywayConfig.java         # Flyway migration settings
    │   │   │   └── AuditConfig.java          # JPA auditing (@CreatedDate etc.)
    │   │   │
    │   │   ├── security/                     # ── Security infrastructure ──
    │   │   │   ├── JwtTokenProvider.java     # Generate & validate JWTs (RS256)
    │   │   │   ├── JwtAuthenticationFilter.java  # OncePerRequestFilter
    │   │   │   ├── CustomOAuth2UserService.java  # Upsert user on Google login
    │   │   │   ├── PermissionEvaluator.java  # Resolve TEXT[] permissions for @PreAuthorize
    │   │   │   └── SecurityUtils.java        # Get current user from SecurityContext
    │   │   │
    │   │   ├── exception/                    # ── Global error handling ──
    │   │   │   ├── GlobalExceptionHandler.java        # @ControllerAdvice
    │   │   │   ├── ResourceNotFoundException.java
    │   │   │   ├── BookingConflictException.java
    │   │   │   └── UnauthorizedActionException.java
    │   │   │
    │   │   ├── model/                        # ── Domain / Entity layer ──
    │   │   │   ├── User.java                 # M4
    │   │   │   ├── Role.java                 # M4
    │   │   │   ├── UserRole.java             # M4
    │   │   │   ├── Location.java             # M1
    │   │   │   ├── Resource.java             # M1
    │   │   │   ├── ResourceAvailability.java # M1
    │   │   │   ├── ResourceTag.java          # M1
    │   │   │   ├── ResourceTagMap.java       # M1
    │   │   │   ├── Booking.java              # M2
    │   │   │   ├── RecurringBookingGroup.java# M2
    │   │   │   ├── Ticket.java               # M3
    │   │   │   ├── TicketAttachment.java     # M3
    │   │   │   ├── TicketComment.java        # M3
    │   │   │   ├── TicketStatusHistory.java  # M3
    │   │   │   ├── Notification.java         # M4
    │   │   │   └── enums/                    # Shared Java enums matching PG ENUMs
    │   │   │       ├── ResourceType.java
    │   │   │       ├── ResourceStatus.java
    │   │   │       ├── DayOfWeek.java
    │   │   │       ├── BookingStatus.java
    │   │   │       ├── TicketPriority.java
    │   │   │       ├── TicketStatus.java
    │   │   │       └── NotificationType.java
    │   │   │
    │   │   ├── dto/                          # ── Data Transfer Objects (records) ──
    │   │   │   ├── common/
    │   │   │   │   ├── ApiErrorResponse.java # Standard error body
    │   │   │   │   └── PageResponse.java     # Generic paginated wrapper
    │   │   │   ├── auth/
    │   │   │   │   ├── LoginRequest.java
    │   │   │   │   ├── AuthResponse.java
    │   │   │   │   ├── UserResponse.java
    │   │   │   │   └── RoleRequest.java
    │   │   │   ├── resource/
    │   │   │   │   ├── ResourceRequest.java
    │   │   │   │   ├── ResourceResponse.java
    │   │   │   │   ├── ResourceAvailabilityRequest.java
    │   │   │   │   ├── LocationRequest.java
    │   │   │   │   └── LocationResponse.java
    │   │   │   ├── booking/
    │   │   │   │   ├── BookingRequest.java
    │   │   │   │   ├── BookingResponse.java
    │   │   │   │   ├── BookingApprovalRequest.java
    │   │   │   │   └── RecurringBookingRequest.java
    │   │   │   ├── ticket/
    │   │   │   │   ├── TicketRequest.java
    │   │   │   │   ├── TicketResponse.java
    │   │   │   │   ├── TicketAssignRequest.java
    │   │   │   │   ├── TicketCommentRequest.java
    │   │   │   │   ├── TicketCommentResponse.java
    │   │   │   │   └── TicketStatusHistoryResponse.java
    │   │   │   └── notification/
    │   │   │       └── NotificationResponse.java
    │   │   │
    │   │   ├── repository/                   # ── Persistence layer ──
    │   │   │   ├── UserRepository.java       # M4
    │   │   │   ├── RoleRepository.java       # M4
    │   │   │   ├── LocationRepository.java   # M1
    │   │   │   ├── ResourceRepository.java   # M1  (custom filters: type, status, capacity, search)
    │   │   │   ├── ResourceAvailabilityRepository.java  # M1
    │   │   │   ├── ResourceTagRepository.java           # M1
    │   │   │   ├── BookingRepository.java    # M2  (by user, resource, date range, status)
    │   │   │   ├── RecurringBookingGroupRepository.java # M2
    │   │   │   ├── TicketRepository.java     # M3  (by reporter, tech, status, priority)
    │   │   │   ├── TicketAttachmentRepository.java      # M3
    │   │   │   ├── TicketCommentRepository.java         # M3
    │   │   │   ├── TicketStatusHistoryRepository.java   # M3
    │   │   │   └── NotificationRepository.java          # M4
    │   │   │
    │   │   ├── service/                      # ── Business / Service layer ──
    │   │   │   ├── AuthService.java          # M4 — OAuth exchange, token refresh
    │   │   │   ├── UserService.java          # M4 — CRUD users, role assignment
    │   │   │   ├── LocationService.java      # M1 — CRUD locations
    │   │   │   ├── ResourceService.java      # M1 — CRUD resources, tags, availability
    │   │   │   ├── BookingService.java       # M2 — create, cancel, approve, reject
    │   │   │   ├── BookingValidationService.java  # M2 — overlap, capacity, window checks
    │   │   │   ├── TicketService.java        # M3 — CRUD tickets, assign, status transitions
    │   │   │   └── NotificationService.java  # M4 — create, list, mark read
    │   │   │
    │   │   └── controller/                   # ── Presentation / REST layer ──
    │   │       ├── AuthController.java       # M4 — /api/v1/auth/**
    │   │       ├── UserController.java       # M4 — /api/v1/users/**
    │   │       ├── LocationController.java   # M1 — /api/v1/locations/**
    │   │       ├── ResourceController.java   # M1 — /api/v1/resources/**
    │   │       ├── BookingController.java    # M2 — /api/v1/bookings/**
    │   │       ├── TicketController.java     # M3 — /api/v1/tickets/**
    │   │       └── NotificationController.java  # M4 — /api/v1/notifications/**
    │   │
    │   └── resources/
    │       ├── application.properties        # Main config
    │       ├── application-dev.properties    # Dev profile overrides
    │       ├── application-prod.properties   # Prod profile overrides
    │       └── db/migration/                 # Flyway SQL migrations
    │           ├── V1__initial_schema.sql
    │           ├── V2__seed_roles_and_tags.sql
    │           └── ...
    │
    └── test/
        └── java/com/smartcampus/backend/
            ├── BackendApplicationTests.java
            ├── controller/                   # Controller integration tests
            │   ├── AuthControllerTest.java
            │   ├── ResourceControllerTest.java
            │   ├── BookingControllerTest.java
            │   └── TicketControllerTest.java
            ├── service/                      # Service unit tests
            │   ├── UserServiceTest.java
            │   ├── ResourceServiceTest.java
            │   ├── BookingServiceTest.java
            │   ├── BookingValidationServiceTest.java
            │   └── TicketServiceTest.java
            └── repository/                   # Repository integration tests
                ├── BookingRepositoryTest.java
                └── ResourceRepositoryTest.java
```

---

## Frontend — React 19 + Vite

```
frontend/
├── index.html
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── tailwind.config.ts              # Tailwind 4 config (if not using CSS-first)
├── vite.config.ts
├── eslint.config.js
├── public/
│   ├── favicon.ico
│   └── logo.svg
└── src/
    ├── main.tsx                     # ReactDOM.createRoot + providers
    ├── App.tsx                      # Router outlet
    ├── index.css                    # Tailwind directives + global styles
    │
    ├── api/                         # HTTP client layer
    │   ├── client.ts                # ky instance with base URL, interceptors
    │   ├── auth.api.ts              # login, logout, refreshToken
    │   ├── resources.api.ts         # CRUD resources, locations
    │   ├── bookings.api.ts          # CRUD bookings, approval
    │   ├── tickets.api.ts           # CRUD tickets, comments, attachments
    │   └── notifications.api.ts     # list, markRead
    │
    ├── hooks/                       # Custom React hooks
    │   ├── useAuth.ts               # Auth context + token management
    │   ├── useResources.ts          # TanStack Query wrappers
    │   ├── useBookings.ts
    │   ├── useTickets.ts
    │   └── useNotifications.ts
    │
    ├── stores/                      # Zustand stores (client-only state)
    │   ├── authStore.ts             # User session, roles, permissions
    │   └── uiStore.ts              # Sidebar, theme, mobile menu
    │
    ├── types/                       # Shared TypeScript types
    │   ├── api.ts                   # DTOs mirroring backend responses
    │   ├── enums.ts                 # ResourceType, BookingStatus, etc.
    │   └── routes.ts                # Route param types
    │
    ├── lib/                         # Pure utility functions
    │   ├── utils.ts                 # cn(), formatDate, etc.
    │   ├── permissions.ts           # hasPermission(), canApproveBooking()
    │   └── validators.ts            # Zod schemas for forms
    │
    ├── components/                  # Shared UI components
    │   ├── ui/                      # Shadcn primitives (button, input, dialog, etc.)
    │   ├── layout/
    │   │   ├── AppLayout.tsx        # Sidebar + header + main area
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   └── ProtectedRoute.tsx   # Role / permission guard
    │   ├── common/
    │   │   ├── StatusBadge.tsx
    │   │   ├── DataTable.tsx        # TanStack Table wrapper
    │   │   ├── Pagination.tsx
    │   │   ├── ConfirmDialog.tsx
    │   │   ├── EmptyState.tsx
    │   │   └── LoadingSpinner.tsx
    │   └── notifications/
    │       ├── NotificationBell.tsx
    │       └── NotificationList.tsx
    │
    ├── features/                    # Feature modules (by domain)
    │   ├── auth/
    │   │   ├── LoginPage.tsx
    │   │   ├── OAuthCallback.tsx
    │   │   └── ProfilePage.tsx
    │   ├── dashboard/
    │   │   ├── DashboardPage.tsx
    │   │   ├── AdminDashboard.tsx
    │   │   ├── TechDashboard.tsx
    │   │   └── widgets/             # Stat cards, charts
    │   ├── resources/
    │   │   ├── ResourceListPage.tsx
    │   │   ├── ResourceDetailPage.tsx
    │   │   ├── ResourceForm.tsx
    │   │   ├── LocationForm.tsx
    │   │   └── AvailabilityGrid.tsx
    │   ├── bookings/
    │   │   ├── BookingListPage.tsx
    │   │   ├── BookingForm.tsx
    │   │   ├── BookingDetailPage.tsx
    │   │   └── BookingApprovalQueue.tsx
    │   ├── tickets/
    │   │   ├── TicketListPage.tsx
    │   │   ├── TicketForm.tsx
    │   │   ├── TicketDetailPage.tsx
    │   │   ├── TicketCommentThread.tsx
    │   │   └── TicketAssignDialog.tsx
    │   └── admin/
    │       ├── UserManagementPage.tsx
    │       ├── RoleEditor.tsx
    │       └── LocationManagementPage.tsx
    │
    └── routes/                      # TanStack Router route definitions
        ├── __root.tsx               # Root route (AppLayout)
        ├── index.tsx                # "/" → landing / login
        ├── dashboard.tsx
        ├── resources/
        │   ├── index.tsx            # /resources
        │   └── $resourceId.tsx      # /resources/:resourceId
        ├── bookings/
        │   ├── index.tsx
        │   ├── new.tsx
        │   └── $bookingId.tsx
        ├── tickets/
        │   ├── index.tsx
        │   ├── new.tsx
        │   └── $ticketId.tsx
        ├── admin/
        │   ├── bookings.tsx
        │   ├── tickets.tsx
        │   ├── resources.tsx
        │   ├── locations.tsx
        │   └── users.tsx
        ├── tech/
        │   └── tickets.tsx
        ├── notifications.tsx
        └── profile.tsx
```

---

## Member Ownership Map

In layered architecture, all members share the same layer packages but are responsible for specific **entity groups** within each layer:

| Domain | Model Files | Repository | Service | Controller | Frontend | Owner |
|--------|-------------|------------|---------|------------|----------|-------|
| Facilities & Assets | `Location`, `Resource`, `ResourceAvailability`, `ResourceTag`, `ResourceTagMap` | `LocationRepository`, `ResourceRepository`, `ResourceAvailabilityRepository`, `ResourceTagRepository` | `LocationService`, `ResourceService` | `LocationController`, `ResourceController` | `features/resources/` | Member 1 |
| Booking Management | `Booking`, `RecurringBookingGroup` | `BookingRepository`, `RecurringBookingGroupRepository` | `BookingService`, `BookingValidationService` | `BookingController` | `features/bookings/` | Member 2 |
| Maintenance & Ticketing | `Ticket`, `TicketAttachment`, `TicketComment`, `TicketStatusHistory` | `TicketRepository`, `TicketAttachmentRepository`, `TicketCommentRepository`, `TicketStatusHistoryRepository` | `TicketService` | `TicketController` | `features/tickets/` | Member 3 |
| Auth, Roles & Notifications | `User`, `Role`, `UserRole`, `Notification` | `UserRepository`, `RoleRepository`, `NotificationRepository` | `AuthService`, `UserService`, `NotificationService` | `AuthController`, `UserController`, `NotificationController` | `features/auth/`, `features/admin/`, `components/notifications/` | Member 4 |

> **Convention:** Each member only edits files in their domain within each layer package. Cross-domain changes require a PR review from the affected member.
