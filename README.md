# Smart Campus Resource Management Platform

Full-stack web application for managing campus resources including locations, assets, bookings, maintenance tickets, and user administration. The project is a monorepo with a Spring Boot backend and a React frontend.

**Stack:** Spring Boot 3 (Java 21), PostgreSQL 16, React 19, TypeScript, Docker Compose

---

## Features and Modules

### Module A: Facilities and Assets (Member 1)
- **Asset management:** CRUD for locations (buildings, floors, rooms) and resources (lecture halls, labs, equipment).
- **Availability tracking:** Weekly time windows for resource availability.
- **Tagging system:** Tags mapped to resources for advanced search and filtering.

### Module B: Booking Management (Member 2)
- **Reservations:** Booking engine constrained by resource availability.
- **Conflict prevention:** PostgreSQL `btree_gist` exclusion constraints prevent double-booking.
- **Recurrence engine:** iCal RRULE support for recurring booking groups.

### Module C: Maintenance and Incident Ticketing (Member 3)
- **Incident ticket API:** Ticket creation and management linked to resources or locations.
- **SLA timer:** Frontend `SLATimerCard` shows time remaining based on priority and `dueDate`.
- **SLA and deadlines:** Backend SLA tracking via `dueDate` and assignment deadlines.
- **Secure attachments:** Multipart uploads with validation (max 3 files, 3 MB each, JPG/PNG/WEBP/GIF).
- **Status workflow and audit trail:** State machine (`OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED` / `REJECTED`) with `ticket_status_history` logging.
- **Role-based visibility:** BOLA defenses for user, technician, and admin access.
- **Notifications:** Alerts on ticket creation, assignment, and updates.
- **Comments:** Threaded comments with edit/delete and ownership checks.

### Module D: Auth, Roles, and Notifications (Member 4)
- **Authentication:** Email/password and Google OAuth 2.0.
- **Security:** Stateless JWT (RS256) with access and refresh tokens.
- **RBAC:** Permission arrays (`TEXT[]`) mapped to ADMIN, USER, and TECHNICIAN roles.
- **Notification engine:** Centralized in-app notifications across modules.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | 24+ | https://docs.docker.com/get-docker/ |
| Docker Compose | v2 (`docker compose`) | Bundled with Docker Desktop |
| Node.js | 20 LTS | https://nodejs.org |
| Java JDK | 21+ | https://adoptium.net (for local backend dev) |

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd it3030-paf-2026-smart-campus-groupXX
```

### 2. Configure environment variables

**Backend (root `.env`):**
```bash
cp .env.example .env
```
Set the required Google OAuth values:
```dotenv
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Frontend (`frontend/.env`):**
```bash
cp frontend/.env.example frontend/.env
```
```dotenv
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Google OAuth redirect URI:
`http://localhost:8080/api/v1/oauth2/callback/google`

### 3. Stop any local PostgreSQL service

```bash
# Linux/macOS
sudo systemctl stop postgresql

# Windows
# Stop "postgresql-x64-xx" from the Services app
```

### 4. Start backend services

```bash
docker compose up --build
```

This starts:
- PostgreSQL 16 on port `5432` with Flyway migrations
- Spring Boot API on port `8080`
- pgAdmin on port `5050`

Wait for:
```
smartcampus-backend | Started BackendApplication in X.XXX seconds
```

### 5. Start the frontend dev server

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | - |
| Backend API | http://localhost:8080/api/v1 | JWT Bearer |
| Swagger UI | http://localhost:8080/api/v1/swagger-ui.html | - |
| pgAdmin | http://localhost:5050 | admin@smartcampus.local / admin |
| PostgreSQL | localhost:5432 | smartcampus / smartcampus |

---

## Authentication Notes

The login page supports:
1. Email/password sign-in
2. Self-registration (role assigned by admin)
3. Google OAuth (requires `VITE_GOOGLE_CLIENT_ID`)

If you self-register, you will see a "Contact admin" banner until a role is assigned.

---

## Default Seed Data

Seeded by Flyway V2 on first startup:

| Item | Value |
|------|-------|
| ADMIN role | All permissions |
| USER role | Basic read and view permissions |

To review seeded data, open pgAdmin and check the `roles` and `users` tables.

---

## Useful Commands

```bash
# Stop everything
docker compose down

# Stop and wipe all data
docker compose down -v

# Rebuild backend after code changes
docker compose up --build backend

# View backend logs
docker compose logs -f backend

# View PostgreSQL logs
docker compose logs -f postgres

# Run backend tests
cd backend && ./mvnw test

# TypeScript type check (frontend)
cd frontend && npx tsc --noEmit
```

---

## Project Structure

```
it3030-paf-2026-smart-campus-groupXX/
├── backend/          Spring Boot application
│   ├── src/main/java/com/smartcampus/backend/
│   │   ├── config/       Security, CORS, JWT, Swagger configuration
│   │   ├── controller/   REST controllers
│   │   ├── dto/          Java 21 records (request/response types)
│   │   ├── exception/    Custom exceptions and global handler
│   │   ├── model/        JPA entities and enums
│   │   ├── repository/   Spring Data JPA repositories
│   │   ├── security/     JWT filter, OAuth2 service, permission evaluator
│   │   └── service/      Business logic
│   └── src/main/resources/
│       ├── application.properties
│       └── db/migration/  Flyway SQL migrations
├── frontend/         React and TypeScript application
│   └── src/
│       ├── api/       HTTP client functions (ky)
│       ├── components/ Reusable UI components
│       ├── hooks/     TanStack Query data hooks
│       ├── lib/       Utilities and permission constants
│       ├── pages/     Route-level page components
│       ├── router.tsx TanStack Router configuration
│       ├── store/     Zustand auth store
│       └── types/     API type definitions
├── docs/             Architecture, API spec, task breakdown
├── docker/           Postgres init SQL, pgAdmin config
├── docker-compose.yml
├── .env.example      Backend environment template
└── CONTRIBUTING.md   Contributor workflow guide
```

---

## Troubleshooting

**Port 5432 already in use**
```bash
sudo systemctl stop postgresql
```

**Flyway migration failed**
```bash
docker compose down -v && docker compose up --build
```

**Frontend cannot reach API**
- Ensure `docker compose up` is running
- Verify `frontend/.env` has `VITE_API_BASE_URL=http://localhost:8080`

**Google OAuth redirect URI mismatch**
- Add `http://localhost:8080/api/v1/oauth2/callback/google` in Google Cloud Console

**"Contact admin" banner after sign-up**  
This is expected — self-registered users have no role. Ask an admin to assign a role via User Management, or do it directly in pgAdmin.
