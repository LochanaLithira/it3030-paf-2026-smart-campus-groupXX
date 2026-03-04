# Data Model Reference

> Smart Campus Resource Management Platform  
> Last updated: 2026-03-04 | Database: PostgreSQL 15+

---

## Entity-Relationship Overview

```
┌──────────┐       ┌──────────┐       ┌────────────┐
│  users   │──M:N──│  roles   │       │ locations  │
└────┬─────┘       └──────────┘       └─────┬──────┘
     │                                      │
     │ 1:N                             1:N  │
     ▼                                      ▼
┌──────────┐  N:1  ┌────────────┐  M:N  ┌──────────────┐
│ bookings │──────▶│ resources  │◀──────│resource_tags │
└──────────┘       └─────┬──────┘       └──────────────┘
                         │
                    1:N  │
                         ▼
                   ┌──────────┐  1:N  ┌─────────────────┐
                   │ tickets  │──────▶│ ticket_comments  │
                   └────┬─────┘       └─────────────────┘
                        │
                   1:N  │
                        ▼
                  ┌────────────────────┐
                  │ ticket_attachments │
                  └────────────────────┘

                  ┌─────────────────┐
                  │  notifications  │ (references users)
                  └─────────────────┘
```

---

## 1. Core Entities

### 1.1 `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Unique identifier |
| `email` | `VARCHAR(150)` | UNIQUE, NOT NULL | Login email |
| `full_name` | `VARCHAR(100)` | NOT NULL | Display name |
| `password_hash` | `TEXT` | NULLABLE | BCrypt hash (NULL for OAuth-only) |
| `oauth_provider` | `VARCHAR(50)` | NULLABLE | e.g. `'GOOGLE'` |
| `oauth_provider_id` | `VARCHAR(255)` | NULLABLE | Provider subject ID |
| `profile_picture_url` | `TEXT` | NULLABLE | Avatar URL from OAuth |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT `TRUE` | Soft-delete flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, auto-trigger | — |

**Indexes:** `idx_users_email`, `idx_users_oauth_provider` (partial)

---

### 1.2 `roles`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `role_id` | `UUID` | PK | — |
| `role_name` | `VARCHAR(50)` | UNIQUE, NOT NULL | `ADMIN`, `USER`, `TECHNICIAN` |
| `permissions` | `TEXT[]` | NOT NULL, DEFAULT `'{}'` | Permission array (see below) |

**Indexes:** `idx_roles_permissions` (GIN)

#### Permission Catalogue

| Permission | ADMIN | USER | TECHNICIAN |
|------------|:-----:|:----:|:----------:|
| `MANAGE_USERS` | x | | |
| `MANAGE_ROLES` | x | | |
| `MANAGE_RESOURCES` | x | | |
| `MANAGE_LOCATIONS` | x | | |
| `VIEW_ALL_BOOKINGS` | x | | |
| `APPROVE_BOOKINGS` | x | | |
| `REJECT_BOOKINGS` | x | | |
| `CANCEL_ANY_BOOKING` | x | | |
| `VIEW_ALL_TICKETS` | x | | |
| `ASSIGN_TICKETS` | x | | |
| `CLOSE_TICKETS` | x | | |
| `VIEW_REPORTS` | x | | |
| `MANAGE_NOTIFICATIONS` | x | | |
| `SYSTEM_SETTINGS` | x | | |
| `VIEW_RESOURCES` | | x | x |
| `CREATE_BOOKING` | | x | |
| `VIEW_OWN_BOOKINGS` | | x | |
| `CANCEL_OWN_BOOKING` | | x | |
| `CREATE_TICKET` | | x | x |
| `VIEW_OWN_TICKETS` | | x | |
| `COMMENT_ON_OWN_TICKET` | | x | |
| `VIEW_NOTIFICATIONS` | | x | x |
| `VIEW_ASSIGNED_TICKETS` | | | x |
| `UPDATE_TICKET_STATUS` | | | x |
| `ADD_RESOLUTION_NOTES` | | | x |
| `COMMENT_ON_ASSIGNED_TICKET` | | | x |

---

### 1.3 `user_roles` (junction)

| Column | Type | Constraints |
|--------|------|-------------|
| `user_id` | `UUID` | PK (composite), FK → `users` |
| `role_id` | `UUID` | PK (composite), FK → `roles` |
| `assigned_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` |

---

## 2. Facilities & Assets

### 2.1 `locations`

| Column | Type | Constraints |
|--------|------|-------------|
| `location_id` | `UUID` | PK |
| `building_name` | `VARCHAR(100)` | NOT NULL |
| `floor_number` | `INT` | NOT NULL |
| `room_number` | `VARCHAR(20)` | NULLABLE |
| `description` | `TEXT` | NULLABLE |
| `created_at` | `TIMESTAMPTZ` | — |
| `updated_at` | `TIMESTAMPTZ` | auto-trigger |

**Unique:** `(building_name, floor_number, room_number)`

---

### 2.2 `resources`

| Column | Type | Constraints |
|--------|------|-------------|
| `resource_id` | `UUID` | PK |
| `name` | `VARCHAR(150)` | NOT NULL |
| `type` | `resource_type` | NOT NULL — `LECTURE_HALL`, `LAB`, `MEETING_ROOM`, `EQUIPMENT` |
| `capacity` | `INT` | CHECK > 0 |
| `location_id` | `UUID` | FK → `locations`, ON DELETE SET NULL |
| `status` | `resource_status` | NOT NULL, DEFAULT `'ACTIVE'` — `ACTIVE`, `OUT_OF_SERVICE`, `UNDER_MAINTENANCE` |
| `description` | `TEXT` | NULLABLE |
| `image_url` | `TEXT` | NULLABLE |
| `created_by` | `UUID` | FK → `users`, ON DELETE SET NULL |
| `created_at` | `TIMESTAMPTZ` | — |
| `updated_at` | `TIMESTAMPTZ` | auto-trigger |

---

### 2.3 `resource_availability`

| Column | Type | Constraints |
|--------|------|-------------|
| `avail_id` | `UUID` | PK |
| `resource_id` | `UUID` | FK → `resources`, ON DELETE CASCADE |
| `day_of_week` | `day_of_week` | `MON`–`SUN` |
| `start_time` | `TIME` | — |
| `end_time` | `TIME` | CHECK `end_time > start_time` |

---

### 2.4 `resource_tags` / `resource_tag_map`

Tags are a pre-defined vocabulary. Resources reference them via a many-to-many join.

| `resource_tags` | Type |
|-----------------|------|
| `tag_id` | UUID PK |
| `tag_name` | VARCHAR(50) UNIQUE |

| `resource_tag_map` | Type |
|---------------------|------|
| `resource_id` | UUID FK → resources |
| `tag_id` | UUID FK → resource_tags |

---

## 3. Booking Management

### 3.1 `bookings`

| Column | Type | Constraints |
|--------|------|-------------|
| `booking_id` | `UUID` | PK |
| `resource_id` | `UUID` | FK → `resources`, ON DELETE CASCADE |
| `user_id` | `UUID` | FK → `users`, ON DELETE CASCADE |
| `booking_date` | `DATE` | NOT NULL |
| `start_time` | `TIME` | NOT NULL |
| `end_time` | `TIME` | CHECK `end_time > start_time` |
| `purpose` | `TEXT` | NOT NULL |
| `expected_attendees` | `INT` | CHECK > 0 |
| `status` | `booking_status` | DEFAULT `'PENDING'` — `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `rejection_reason` | `VARCHAR(255)` | NULLABLE |
| `reviewed_by` | `UUID` | FK → `users` |
| `reviewed_at` | `TIMESTAMPTZ` | NULLABLE |
| `recurring_group_id` | `UUID` | FK → `recurring_booking_groups`, NULLABLE |
| `created_at` | `TIMESTAMPTZ` | — |
| `updated_at` | `TIMESTAMPTZ` | auto-trigger |

**Exclusion constraint** `excl_no_double_booking`: prevents overlapping **APPROVED** bookings on the same resource + date using `btree_gist`.

---

### 3.2 `recurring_booking_groups`

| Column | Type | Description |
|--------|------|-------------|
| `group_id` | `UUID` | PK |
| `user_id` | `UUID` | FK → users |
| `resource_id` | `UUID` | FK → resources |
| `recurrence_rule` | `VARCHAR(255)` | iCal RRULE (e.g. `FREQ=WEEKLY;BYDAY=MO,WE`) |
| `start_date` / `end_date` | `DATE` | Range of recurrence |
| `start_time` / `end_time` | `TIME` | Slot per occurrence |
| `purpose` | `TEXT` | — |
| `created_at` | `TIMESTAMPTZ` | — |

Individual occurrences are materialized as rows in `bookings` linked by `recurring_group_id`.

---

## 4. Maintenance & Ticketing

### 4.1 `tickets`

| Column | Type | Constraints |
|--------|------|-------------|
| `ticket_id` | `UUID` | PK |
| `resource_id` | `UUID` | FK → `resources`, ON DELETE CASCADE |
| `reporter_id` | `UUID` | FK → `users`, ON DELETE CASCADE |
| `assigned_tech_id` | `UUID` | FK → `users`, NULLABLE, ON DELETE SET NULL |
| `category` | `VARCHAR(100)` | NOT NULL |
| `description` | `TEXT` | NOT NULL |
| `priority` | `ticket_priority` | DEFAULT `'LOW'` — `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `status` | `ticket_status` | DEFAULT `'OPEN'` — `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED` |
| `resolution_notes` | `TEXT` | NULLABLE |
| `due_date` | `DATE` | SLA target, NULLABLE |
| `resolved_at` | `TIMESTAMPTZ` | NULLABLE |
| `created_at` | `TIMESTAMPTZ` | — |
| `updated_at` | `TIMESTAMPTZ` | auto-trigger |

---

### 4.2 `ticket_attachments`

| Column | Type |
|--------|------|
| `attachment_id` | UUID PK |
| `ticket_id` | UUID FK → tickets CASCADE |
| `file_url` | TEXT NOT NULL |
| `file_name` | VARCHAR(255) |
| `file_size` | INT (bytes) |
| `uploaded_by` | UUID FK → users |
| `uploaded_at` | TIMESTAMPTZ |

---

### 4.3 `ticket_comments`

| Column | Type |
|--------|------|
| `comment_id` | UUID PK |
| `ticket_id` | UUID FK → tickets CASCADE |
| `author_id` | UUID FK → users CASCADE |
| `content` | TEXT NOT NULL |
| `created_at` | TIMESTAMPTZ |
| `updated_at` | TIMESTAMPTZ (auto-trigger) |

---

### 4.4 `ticket_status_history`

| Column | Type |
|--------|------|
| `history_id` | UUID PK |
| `ticket_id` | UUID FK → tickets CASCADE |
| `changed_by` | UUID FK → users CASCADE |
| `old_status` | `ticket_status` |
| `new_status` | `ticket_status` |
| `note` | TEXT |
| `changed_at` | TIMESTAMPTZ |

---

## 5. Notifications

### 5.1 `notifications`

| Column | Type | Description |
|--------|------|-------------|
| `notification_id` | `UUID` | PK |
| `recipient_id` | `UUID` | FK → users CASCADE |
| `title` | `VARCHAR(255)` | Short heading |
| `message` | `TEXT` | Body text |
| `type` | `notification_type` | See enum below |
| `is_read` | `BOOLEAN` | DEFAULT `FALSE` |
| `related_entity_id` | `UUID` | Generic reference to booking / ticket |
| `created_at` | `TIMESTAMPTZ` | — |

**Enum values:** `BOOKING_CREATED`, `BOOKING_APPROVED`, `BOOKING_REJECTED`, `BOOKING_CANCELLED`, `TICKET_CREATED`, `TICKET_ASSIGNED`, `TICKET_UPDATED`, `TICKET_RESOLVED`, `MAINTENANCE_ALERT`, `SYSTEM`, `ROLE_CHANGE`

---

## 6. Enum Types Summary

| Enum | Values |
|------|--------|
| `resource_type` | `LECTURE_HALL`, `LAB`, `MEETING_ROOM`, `EQUIPMENT` |
| `resource_status` | `ACTIVE`, `OUT_OF_SERVICE`, `UNDER_MAINTENANCE` |
| `day_of_week` | `MON`–`SUN` |
| `booking_status` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `ticket_priority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `ticket_status` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED` |
| `notification_type` | 11 values (see notifications section) |

---

## 7. JPA Entity Mapping Notes (Spring Boot)

| DB Column Type | Java Type | Annotation |
|----------------|-----------|------------|
| `UUID` | `java.util.UUID` | `@Id @GeneratedValue(strategy = GenerationType.UUID)` |
| `TIMESTAMPTZ` | `java.time.Instant` or `OffsetDateTime` | `@Column(columnDefinition = "TIMESTAMPTZ")` |
| `TEXT[]` | `List<String>` | Hibernate 7+ `@JdbcTypeCode(SqlTypes.ARRAY)` |
| PostgreSQL ENUM | Java `enum` | `@Enumerated(EnumType.STRING)` + `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` |
| `TIME` | `java.time.LocalTime` | `@Column(columnDefinition = "TIME")` |
| `DATE` | `java.time.LocalDate` | — |

Use `@EntityListeners(AuditingEntityListener.class)` with `@CreatedDate` / `@LastModifiedDate` for automatic timestamps (Spring Data JPA Auditing).
