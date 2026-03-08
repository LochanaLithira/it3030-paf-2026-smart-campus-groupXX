# Smart Campus Resource Management Platform

Full-stack web application for managing campus resources — rooms, equipment, bookings, maintenance tickets, and user administration.

**Stack:** Spring Boot 3 (Java 21) · PostgreSQL 16 · React 19 · TypeScript · Docker Compose

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | 24+ | https://docs.docker.com/get-docker/ |
| Docker Compose | v2 (`docker compose`) | Bundled with Docker Desktop |
| Node.js | 20 LTS | https://nodejs.org |
| Java JDK | 21+ | https://adoptium.net (only needed for local backend dev) |

---

## Quick Start (Recommended)

### 1. Clone the repo

```bash
git clone <repo-url>
cd it3030-paf-2026-smart-campus-groupXX
```

### 2. Configure environment variables

**Backend (root `.env`):**
```bash
cp .env.example .env
```
Open `.env` and fill in the two required fields:
```dotenv
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```
Everything else has working defaults for local development.

> **Where to get Google credentials:** Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application).  
> Add `http://localhost:8080/api/v1/oauth2/callback/google` as an **Authorized redirect URI**.

**Frontend (`.env` in `frontend/`):**
```bash
cp frontend/.env.example frontend/.env
```
Open `frontend/.env` and fill in:
```dotenv
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 3. Stop any local PostgreSQL (it conflicts on port 5432)

```bash
# Linux/macOS
sudo systemctl stop postgresql   # or: brew services stop postgresql

# Windows — from Services app, stop "postgresql-x64-xx"
```

### 4. Start the backend stack

```bash
docker compose up --build
```

This starts:
- **PostgreSQL 16** on port `5432` — auto-migrates schema via Flyway on first run
- **Spring Boot API** on port `8080` — waits for Postgres health before starting
- **pgAdmin** on port `5050`

Wait until you see log output like:
```
smartcampus-backend | Started BackendApplication in X.XXX seconds
```

### 5. Start the frontend dev server

In a **separate terminal**:
```bash
cd frontend
npm install
npm run dev
```

Frontend is served at **http://localhost:5173**.

---

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | — |
| Backend API | http://localhost:8080/api/v1 | JWT Bearer |
| Swagger UI | http://localhost:8080/api/v1/swagger-ui.html | — |
| pgAdmin | http://localhost:5050 | admin@smartcampus.local / admin |
| PostgreSQL (direct) | localhost:5432 | smartcampus / smartcampus |

---

## Logging In

The app supports three ways to authenticate:

1. **Email/Password** — use the Sign In tab on the login page
2. **Sign Up** — create an account (you will have no role until an admin assigns one)
3. **Google OAuth** — requires valid `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`

> If you sign up yourself, your account shows a yellow "Contact admin" banner until a user with admin access assigns you a role. To get admin access for local dev, use the seeded admin credentials or update the role directly in pgAdmin.

---

## Default Seed Data

The database is automatically seeded on first startup (Flyway V2 migration):

| Item | Value |
|------|-------|
| ADMIN role | Has all permissions |
| USER role | Basic read/view permissions |

To check what was seeded, open pgAdmin at http://localhost:5050, connect to the `smartcampus` database, and browse the `roles` and `users` tables.

---

## Useful Commands

```bash
# Stop everything
docker compose down

# Stop and wipe all data (fresh start)
docker compose down -v

# Rebuild after backend code changes
docker compose up --build backend

# View backend logs
docker compose logs -f backend

# View postgres logs
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
│   │   ├── exception/    Custom exceptions + global handler
│   │   ├── model/        JPA entities + enums
│   │   ├── repository/   Spring Data JPA repositories
│   │   ├── security/     JWT filter, OAuth2 service, permission evaluator
│   │   └── service/      Business logic
│   └── src/main/resources/
│       ├── application.properties
│       └── db/migration/  Flyway SQL migrations
├── frontend/         React + TypeScript application
│   └── src/
│       ├── api/       HTTP client functions (ky)
│       ├── components/ Reusable UI components
│       ├── hooks/     TanStack Query data hooks
│       ├── lib/       Utilities, permission constants
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

## Documentation

All design documents are in `docs/`:

| File | Contents |
|------|---------|
| `api_doc.md` | Full REST API reference — every endpoint, request/response, status codes |
| `data_model.md` | Database schema, ER diagram, permission catalogue |
| `tasks.md` | 129 tasks broken down by member with sprint assignments |
| `design_guideline.md` | Coding conventions, Git workflow, API patterns |
| `implementation_master_plan.md` | Sprint timeline and dependency graph |
| `security_concerns.md` | Auth/JWT/RBAC security notes |
| `user-journeys.md` | User flows for all 3 roles |

For code generation / AI assistant context, see `claude.md` at the root.

---

## Troubleshooting

**Port 5432 already in use**
```bash
sudo systemctl stop postgresql
# or kill the process: sudo lsof -i :5432 | grep LISTEN
```

**Backend won't start — "Flyway migration failed"**
```bash
# Wipe the database volume and start fresh
docker compose down -v && docker compose up --build
```

**Frontend shows "Network Error" / can't reach API**
- Make sure `docker compose up` is running
- Check `frontend/.env` has `VITE_API_BASE_URL=http://localhost:8080`

**Google OAuth "redirect_uri_mismatch"**
- In Google Cloud Console, ensure `http://localhost:8080/api/v1/oauth2/callback/google` is listed as an Authorized Redirect URI

**"Contact admin" banner after sign-up**  
This is expected — self-registered users have no role. Ask an admin to assign a role via User Management, or do it directly in pgAdmin.
