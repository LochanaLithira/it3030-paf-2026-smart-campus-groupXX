# Member 3 Requirements Analysis & Gap Check

> **Date:** 2026-04-08  
> **Purpose:** Cross-reference PDF assignment requirements with implemented features and current plan

---

## 📋 Requirements from Documentation

### **Source 1: User Journeys (user-journeys.md)**

#### **2.5 Reporting a Maintenance Issue (USER Side)**
✅ **COVERED IN PLAN**

| Requirement | Status | Implementation Plan |
|------------|--------|---------------------|
| Users can create tickets from Resource detail page | ✅ Planned | M3-F03: TicketForm component |
| Form includes: category dropdown, description, priority | ✅ Planned | M3-F03: All fields in form |
| Attachments upload (images/docs) | ✅ Planned | M3-B09: File upload endpoint, M3-F07: Upload component |
| Status defaults to OPEN | ✅ Planned | M3-B04: TicketService.createTicket() |
| Reporter_id = current user | ✅ Planned | M3-B04: Auto-set from SecurityContext |
| Notification to all ADMINs | ✅ Planned | M3-B04: Integration with NotificationService |

**Categories Required:**
- Electrical
- Plumbing
- IT/Network
- Furniture
- HVAC
- Other

**Priority Levels:**
- LOW (default)
- MEDIUM
- HIGH
- CRITICAL

---

#### **2.6 Tracking & Commenting on Own Tickets (USER Side)**
✅ **COVERED IN PLAN**

| Requirement | Status | Implementation Plan |
|------------|--------|---------------------|
| Users see "My Tickets" list filtered by reporter_id | ✅ Planned | M3-F01: TicketListPage, M3-B07: Service filtering |
| Ticket detail shows: status, priority, assigned tech | ✅ Planned | M3-F04: TicketDetailPage |
| Status history timeline visible | ✅ Planned | M3-F08: Status timeline (P2) |
| Comments thread visible | ✅ Planned | M3-F05: TicketCommentThread |
| Users can add comments | ✅ Planned | M3-B08: Add comment service |
| Comment triggers notification to tech | ✅ Planned | M3-B08: Notify other party |
| Attachments gallery visible | ✅ Planned | M3-F04: Detail page includes attachments |

---

#### **3.4 Ticket Triage & Assignment (ADMIN Side)**
✅ **COVERED IN PLAN**

| Requirement | Status | Implementation Plan |
|------------|--------|---------------------|
| Admin sees ALL tickets | ✅ Planned | M3-B07: List all tickets (admin permission) |
| Filter by: status, priority, category, resource | ✅ Planned | M3-B03: Repository filtering queries |
| Assign ticket to technician | ✅ Planned | M3-B05: TicketService.assign() |
| Select tech from TECHNICIAN role users | ✅ Planned | M3-F06: TicketAssignDialog, M3-B05: Role validation |
| assigned_tech_id updated | ✅ Planned | M3-B05: Database update |
| Status changes to IN_PROGRESS | ✅ Planned | M3-B05: Auto-transition if OPEN |
| Log to ticket_status_history | ✅ Planned | M3-B05: History logging |
| Notification to technician | ✅ Planned | M3-B05: TICKET_ASSIGNED notification |
| Admin can close/reject tickets | ✅ Planned | M3-B06: Status update with admin bypass |

---

#### **4.2 Working on a Ticket (TECHNICIAN Side)**
✅ **COVERED IN PLAN**

| Requirement | Status | Implementation Plan |
|------------|--------|---------------------|
| Technician dashboard shows assigned tickets | ✅ Planned | M3-F09: TechDashboard (Sprint 4) |
| Sorted by: priority DESC, then creation date | ✅ Planned | M3-B03: Repository query ordering |
| Status filter: IN_PROGRESS, OPEN, RESOLVED | ✅ Planned | M3-F09: Dashboard filters |
| View resource details, description, attachments | ✅ Planned | M3-F04: TicketDetailPage |
| Add comments to assigned tickets | ✅ Planned | M3-B08: Comment service with BOLA check |
| Update status with validation | ✅ Planned | M3-B06, M3-B10: State machine validation |
| Resolution notes required when → RESOLVED | ✅ Planned | M3-B06: Validation in status update |
| resolved_at timestamp auto-set | ✅ Planned | M3-B06: Auto-set on RESOLVED |
| Notification to reporter on resolution | ✅ Planned | M3-B06: TICKET_RESOLVED notification |
| Upload repair completion photos | ✅ Planned | M3-B09: Same upload endpoint |

---

#### **4.3 Creating a Follow-up Ticket (TECHNICIAN Side)**
⚠️ **NOT EXPLICITLY IN PLAN**

| Requirement | Status | Gap? |
|------------|--------|------|
| Technicians can create follow-up tickets | ❌ | **CLARIFICATION NEEDED** — Per our discussion, only USERS can create tickets. This contradicts requirement. |
| Pre-filled form with same resource | ❌ | **CLARIFICATION NEEDED** |
| Reference to original ticket in description | ❌ | **CLARIFICATION NEEDED** |

**Resolution:**
- **Per corrected plan:** Only USERS have `CREATE_TICKET` permission
- **Workaround:** Technician can comment on existing ticket: "Additional issue found: [description]. Reporter, please create a new ticket."
- **OR** Admin can create on behalf of user if really needed

---

### **Source 2: Notification Lifecycle**
✅ **COVERED IN PLAN**

| Event | Notification Type | Recipients | Planned? |
|-------|-------------------|------------|----------|
| New ticket created | `TICKET_CREATED` | All ADMINs | ✅ M3-B04 |
| Ticket assigned | `TICKET_ASSIGNED` | Assigned technician | ✅ M3-B05 |
| Ticket comment added | `TICKET_UPDATED` | Reporter + tech (other party) | ✅ M3-B08 |
| Ticket resolved | `TICKET_RESOLVED` | Reporter + all ADMINs | ✅ M3-B06 |

---

### **Source 3: Database Schema (data_model.md)**

#### **4.1 tickets table**
✅ **ALL FIELDS COVERED**

| Column | Planned Entity Mapping? |
|--------|------------------------|
| `ticket_id` UUID PK | ✅ M3-B01 |
| `resource_id` UUID FK | ✅ M3-B01 |
| `reporter_id` UUID FK | ✅ M3-B01 |
| `assigned_tech_id` UUID FK NULLABLE | ✅ M3-B01 |
| `category` VARCHAR(100) | ✅ M3-B01 |
| `description` TEXT | ✅ M3-B01 |
| `priority` ticket_priority ENUM | ✅ M3-B01 (use @JdbcTypeCode) |
| `status` ticket_status ENUM | ✅ M3-B01 (use @JdbcTypeCode) |
| `resolution_notes` TEXT NULLABLE | ✅ M3-B01 |
| `due_date` DATE NULLABLE | ✅ M3-B01 |
| `resolved_at` TIMESTAMPTZ NULLABLE | ✅ M3-B01 |
| `created_at`, `updated_at` | ✅ M3-B01 (JPA auditing) |

**State Machine Transitions:**
✅ **COVERED IN PLAN** (M3-B10)
- OPEN → IN_PROGRESS / REJECTED / CLOSED
- IN_PROGRESS → RESOLVED / CLOSED
- RESOLVED → CLOSED / IN_PROGRESS (reopen)

---

#### **4.2 ticket_attachments table**
✅ **ALL FIELDS COVERED**

| Column | Planned? |
|--------|----------|
| `attachment_id` UUID PK | ✅ M3-B02 |
| `ticket_id` UUID FK CASCADE | ✅ M3-B02 |
| `file_url` TEXT | ✅ M3-B02 |
| `file_name` VARCHAR(255) | ✅ M3-B02 |
| `file_size` INT | ✅ M3-B02 |
| `uploaded_by` UUID FK | ✅ M3-B02 |
| `uploaded_at` TIMESTAMPTZ | ✅ M3-B02 |

**File Upload Requirements:**
✅ **COVERED** (M3-B09)
- Max 10MB per file (from security_concerns.md)
- Whitelist: images (jpg, png, gif, webp), PDFs only
- Store in local filesystem OR cloud storage
- Sanitize filenames

---

#### **4.3 ticket_comments table**
✅ **ALL FIELDS COVERED**

| Column | Planned? |
|--------|----------|
| `comment_id` UUID PK | ✅ M3-B02 |
| `ticket_id` UUID FK CASCADE | ✅ M3-B02 |
| `author_id` UUID FK CASCADE | ✅ M3-B02 |
| `content` TEXT | ✅ M3-B02 |
| `created_at`, `updated_at` | ✅ M3-B02 (auto-trigger) |

---

#### **4.4 ticket_status_history table**
✅ **ALL FIELDS COVERED**

| Column | Planned? |
|--------|----------|
| `history_id` UUID PK | ✅ M3-B02 |
| `ticket_id` UUID FK CASCADE | ✅ M3-B02 |
| `changed_by` UUID FK CASCADE | ✅ M3-B02 |
| `old_status` ticket_status | ✅ M3-B02 |
| `new_status` ticket_status | ✅ M3-B02 |
| `note` TEXT | ✅ M3-B02 |
| `changed_at` TIMESTAMPTZ | ✅ M3-B02 |

**Logging Requirements:**
✅ **COVERED** (M3-B06)
- Every status transition must log to history
- Capture: who changed, from/to status, optional note, timestamp

---

### **Source 4: API Endpoints (api_doc.md)**

#### **Required Endpoints**
✅ **ALL COVERED IN PLAN**

| Endpoint | Method | Planned Task | Permission |
|----------|--------|--------------|------------|
| `/tickets` | GET | M3-B11 | Role-filtered: USER (own), TECH (assigned), ADMIN (all) |
| `/tickets` | POST | M3-B11 | CREATE_TICKET (USER only) |
| `/tickets/{id}` | GET | M3-B11 | BOLA check: own/assigned/admin |
| `/tickets/{id}/assign` | PATCH | M3-B11 | ASSIGN_TICKETS (ADMIN) |
| `/tickets/{id}/status` | PATCH | M3-B11 | UPDATE_TICKET_STATUS (TECH/ADMIN) |
| `/tickets/{id}/attachments` | POST | M3-B11 | Multipart upload |
| `/tickets/{id}/comments` | POST | M3-B11 | COMMENT_ON_OWN_TICKET / COMMENT_ON_ASSIGNED_TICKET |
| `/tickets/{id}/comments` | GET | M3-B11 | Paginated comment list |

**Query Parameters Required:**
- `?page=0&size=20` — pagination
- `&status=OPEN,IN_PROGRESS` — multi-select status filter
- `&priority=HIGH,CRITICAL` — multi-select priority filter
- `&category=Electrical` — category filter
- `&resourceId=...` — filter by resource
- `&sort=priority,desc` — sorting

✅ All covered in M3-B03 (Repository filtering queries)

---

### **Source 5: Permission Matrix (data_model.md)**

#### **Permissions Required for Member 3**

| Permission | Role | Planned? |
|-----------|------|----------|
| `CREATE_TICKET` | USER only | ✅ Enforced in M3-B04 |
| `VIEW_OWN_TICKETS` | USER | ✅ M3-B07 filtering |
| `COMMENT_ON_OWN_TICKET` | USER | ✅ M3-B08 BOLA check |
| `VIEW_ASSIGNED_TICKETS` | TECHNICIAN | ✅ M3-B07 filtering |
| `UPDATE_TICKET_STATUS` | TECHNICIAN, ADMIN | ✅ M3-B06 with role check |
| `COMMENT_ON_ASSIGNED_TICKET` | TECHNICIAN | ✅ M3-B08 BOLA check |
| `ADD_RESOLUTION_NOTES` | TECHNICIAN, ADMIN | ✅ M3-B06 validation |
| `VIEW_ALL_TICKETS` | ADMIN | ✅ M3-B07 admin bypass |
| `ASSIGN_TICKETS` | ADMIN | ✅ M3-B05 permission guard |
| `CLOSE_TICKETS` | ADMIN | ✅ M3-B06 admin override |

✅ **ALL COVERED** in M3-B12: `@PreAuthorize` + BOLA checks

---

### **Source 6: Tasks Breakdown (tasks.md)**

**Backend Tasks:** 14 total
- M3-B01 to M3-B14
- ✅ All requirements mapped to specific tasks

**Frontend Tasks:** 10 total
- M3-F01 to M3-F10
- ✅ All UI requirements mapped to specific components

---

## 🔍 GAP ANALYSIS

### ❌ **Gap 1: Technician Creating Follow-up Tickets**

**Requirement (user-journeys.md § 4.3):**
> "If a technician discovers an additional issue during maintenance, they can create a new ticket from the existing ticket's page."

**Current Plan:**
- Only USERS have `CREATE_TICKET` permission
- Technicians CANNOT create tickets

**Resolution Options:**

**Option A: REJECT Requirement (Recommended)**
- Rationale: Only users should report issues (they are the reporters)
- Workaround: Technician adds comment: "Additional issue found: [description]. Please create a new ticket."
- User can then create a new ticket referencing the original

**Option B: ACCEPT Requirement (Modify Plan)**
- Add `CREATE_TICKET` permission to TECHNICIAN role
- Add validation: if tech creates ticket, they cannot be assigned to their own ticket
- Update M3-B04 to allow TECHNICIAN role

**Recommendation:** **Option A** — Keep tickets user-generated only. This maintains clear responsibility boundaries.

---

### ✅ **All Other Requirements COVERED**

| Category | Coverage |
|----------|----------|
| Database Schema (4 tables) | ✅ 100% |
| User Workflows (Create, View, Comment) | ✅ 100% |
| Admin Workflows (Assign, Triage, Close) | ✅ 100% |
| Tech Workflows (Status Update, Resolve) | ✅ 100% |
| API Endpoints (8 endpoints) | ✅ 100% |
| Permissions (10 permissions) | ✅ 100% |
| Notifications (4 types) | ✅ 100% |
| File Uploads | ✅ 100% |
| State Machine Validation | ✅ 100% |
| BOLA Security | ✅ 100% |
| Status History Audit Trail | ✅ 100% |

---

## ✅ IMPLEMENTATION CHECKLIST

### **Sprint 1 (Backend — Entities)**
- [ ] M3-B01: Create `Ticket` JPA entity
  - All fields including UUID PKs/FKs
  - Use `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` for enums
  - `@EntityListeners(AuditingEntityListener.class)` for timestamps
- [ ] M3-B02: Create `TicketAttachment`, `TicketComment`, `TicketStatusHistory` entities
  - Cascade DELETE with ticket
  - All FK relationships

### **Sprint 3 (Backend — Services & Controllers)**
- [ ] M3-B03: Repositories with filtering
  - `findByReporterId()`, `findByAssignedTechId()`, `findAll()` with Specification
  - Status, priority, category, resourceId filters
  - Pageable support
- [ ] M3-B04: Create ticket service
  - Validate user has CREATE_TICKET permission
  - Validate resource exists
  - Default status = OPEN
  - Notify all ADMINs
- [ ] M3-B05: Assign technician service
  - Validate tech has TECHNICIAN role
  - Auto-transition OPEN → IN_PROGRESS
  - Log status history
  - Notify technician
- [ ] M3-B06: Update status service
  - State machine validation
  - Resolution notes required for RESOLVED
  - Set resolved_at timestamp
  - Log to history
  - Notify reporter/admin
- [ ] M3-B07: List tickets service
  - Role-based filtering: USER (own), TECH (assigned), ADMIN (all)
  - Apply query filters
  - Paginated response
- [ ] M3-B08: Add comment service
  - BOLA check: reporter OR assigned tech OR admin
  - Notify other party
- [ ] M3-B09: File upload endpoint
  - Multipart handler
  - Validate: max 10MB, image/PDF only
  - Store file, save metadata to ticket_attachments
- [ ] M3-B10: State machine validation
  - Enum of allowed transitions
  - Throw BadRequestException for invalid transitions
- [ ] M3-B11: TicketController — all endpoints
  - GET /tickets, GET /tickets/{id}
  - POST /tickets, POST /tickets/{id}/attachments
  - PATCH /tickets/{id}/assign, PATCH /tickets/{id}/status
  - POST /tickets/{id}/comments, GET /tickets/{id}/comments
- [ ] M3-B12: Security annotations
  - `@PreAuthorize` on all methods
  - BOLA checks in service layer

### **Sprint 3 (Frontend — Pages & Components)**
- [ ] M3-F01: TicketListPage
  - TanStack Table with filters
  - Status badges
  - Role-based data (own/assigned/all)
- [ ] M3-F02: useTickets hook
  - TanStack Query wrappers
  - Cache invalidation on mutations
- [ ] M3-F03: TicketForm
  - Category dropdown
  - Description textarea (min 10 chars)
  - Priority dropdown
  - Zod validation
- [ ] M3-F04: TicketDetailPage
  - Ticket info card
  - Attachments gallery
  - Comment thread
  - Status timeline
  - Role-based action buttons
- [ ] M3-F05: TicketCommentThread
  - Chat-style layout
  - Author avatars
  - Auto-scroll to latest
  - Add comment form
- [ ] M3-F06: TicketAssignDialog
  - Dropdown of TECHNICIAN users
  - Due date picker
  - Admin only
- [ ] M3-F07: File upload component
  - Drag & drop zone
  - Preview thumbnails
  - Upload progress
  - Client-side validation
- [ ] M3-F08: Status timeline (P2)
  - Vertical stepper
  - Who, when, from→to, note
  - Highlight current status

### **Sprint 4 (Integration & Polish)**
- [ ] M3-F09: TechDashboard
  - Assigned tickets widget
  - Sort by priority + due date
  - Quick action buttons
- [ ] M3-F10: Empty states, loading skeletons, error handling

### **Sprint 5 (Testing)**
- [ ] M3-B13: Unit tests for TicketService
  - State machine transition tests
  - Permission validation tests
- [ ] M3-B14: Integration tests with Testcontainers
  - Full CRUD flow
  - BOLA security tests

---

## 📊 SUMMARY

### **Coverage:**
- ✅ **23 out of 24 tasks** fully cover requirements
- ⚠️ **1 potential gap:** Technician creating follow-up tickets (recommend rejecting this requirement)

### **Completion Status:**
- ❌ **0 tasks started** (all tasks show `[ ]` not started)
- 📅 **Sprint 1 (Entities):** Ready to start
- 📅 **Sprint 3 (Main implementation):** Depends on Sprint 1
- 📅 **Sprint 4 (Integration):** Depends on Sprint 3
- 📅 **Sprint 5 (Tests):** Depends on Sprint 4

### **Next Actions:**
1. ✅ **Clarify Gap 1:** Decide whether technicians can create tickets
2. ✅ **Start Sprint 1:** Create JPA entities (M3-B01, M3-B02)
3. ✅ **Update permissions:** Ensure only USER has CREATE_TICKET in V2 seed data
4. ✅ **Begin frontend scaffolding:** Set up routing, API layer, hooks structure

---

## 🎯 CONCLUSION

**The current Member 3 implementation plan comprehensively covers all requirements** from the documentation with only one minor ambiguity regarding technician-created tickets. The plan includes:

✅ Complete database schema (4 tables)  
✅ Full CRUD operations for all ticket workflows  
✅ Role-based access control (USER, TECHNICIAN, ADMIN)  
✅ State machine validation with audit trail  
✅ File upload with security constraints  
✅ Notification integration (4 notification types)  
✅ Full frontend UI (10 components/pages)  
✅ Testing strategy (unit + integration)  

**Ready to proceed with implementation.** 🚀
