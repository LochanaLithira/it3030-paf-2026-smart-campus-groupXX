# Member 3: Admin-Side Implementation Complete Guide

**Date:** 2026-04-07  
**Target:** Complete all Admin capabilities for ticket management  
**Status:** Backend 100% ✅ | Frontend 0% ⏳

---

## Overview

Admins have the most powerful ticket management capabilities:
- **View ALL tickets** across the system (not just their own)
- **Filter and search** tickets by status, priority, category, assignee
- **Assign tickets** to technicians with due dates
- **Update ticket status** (including REJECT with reason)
- **Close tickets** when resolved
- **Add comments** to any ticket

---

## Admin-Side Features (Backend Already Done ✅)

### 1. View All Tickets with Filtering
**Endpoint:** `GET /api/v1/tickets`  
**Permission:** `VIEW_ALL_TICKETS` (ADMIN only)

**Already Implemented:**
- File: `TicketController.java` lines 36-50
- File: `TicketService.java` lines 54-86
- Supports pagination: `?page=0&size=20`
- Filters:
  - `status` - OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
  - `priority` - LOW, MEDIUM, HIGH, CRITICAL
  - `category` - ELECTRICAL, PLUMBING, HVAC, IT, etc.
  - `assignedTechId` - UUID of assigned technician
  - `reporterId` - UUID of user who created ticket

**Example Requests:**
```http
# View all open tickets
GET /api/v1/tickets?status=OPEN&page=0&size=20

# View high priority tickets
GET /api/v1/tickets?priority=HIGH

# View tickets assigned to specific tech
GET /api/v1/tickets?assignedTechId={tech-uuid}

# View all ELECTRICAL category tickets
GET /api/v1/tickets?category=ELECTRICAL
```

**Response:**
```json
{
  "content": [
    {
      "ticketId": "uuid",
      "resourceName": "Room A101 Projector",
      "resourceId": "uuid",
      "reporter": {
        "userId": "uuid",
        "fullName": "John Doe",
        "email": "john@university.edu"
      },
      "assignedTech": null,
      "category": "IT",
      "description": "Projector won't turn on",
      "priority": "MEDIUM",
      "status": "OPEN",
      "preferredContactEmail": "john@university.edu",
      "preferredContactPhone": "+94771234567",
      "attachmentCount": 2,
      "commentCount": 0,
      "createdAt": "2026-04-07T10:30:00Z",
      "updatedAt": "2026-04-07T10:30:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 45,
  "totalPages": 3
}
```

---

### 2. View Ticket Details
**Endpoint:** `GET /api/v1/tickets/{id}`  
**Permission:** `VIEW_ALL_TICKETS` (ADMIN)

**Already Implemented:**
- File: `TicketController.java` lines 52-58
- File: `TicketService.java` lines 88-96
- Returns full ticket details including:
  - All attachments with file URLs
  - All comments (threaded conversation)
  - Complete status history (audit trail)
  - Contact details (email, phone)
  - Resource details with location
  - Reporter and assignee info

**Example Request:**
```http
GET /api/v1/tickets/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {admin-token}
```

**Response:**
```json
{
  "ticketId": "550e8400-e29b-41d4-a716-446655440000",
  "resource": {
    "resourceId": "uuid",
    "name": "Room A101 Projector",
    "type": "EQUIPMENT",
    "location": "Building A, Floor 1, Room 101"
  },
  "reporter": {
    "userId": "uuid",
    "fullName": "John Doe",
    "email": "john@university.edu"
  },
  "assignedTech": null,
  "category": "IT",
  "description": "Projector displays 'No Signal' error...",
  "priority": "MEDIUM",
  "status": "OPEN",
  "resolutionNotes": null,
  "dueDate": null,
  "resolvedAt": null,
  "preferredContactEmail": "john@university.edu",
  "preferredContactPhone": "+94771234567",
  "attachments": [
    {
      "attachmentId": "uuid",
      "fileName": "projector_error.jpg",
      "fileUrl": "/uploads/tickets/uuid/projector_error.jpg",
      "fileSize": 245678,
      "uploadedBy": {
        "userId": "uuid",
        "fullName": "John Doe",
        "email": "john@university.edu"
      },
      "uploadedAt": "2026-04-07T10:32:00Z"
    }
  ],
  "comments": [],
  "statusHistory": [
    {
      "historyId": "uuid",
      "changedBy": {
        "userId": "uuid",
        "fullName": "System",
        "email": "system@smartcampus.local"
      },
      "oldStatus": null,
      "newStatus": "OPEN",
      "note": "Ticket created",
      "changedAt": "2026-04-07T10:30:00Z"
    }
  ],
  "createdAt": "2026-04-07T10:30:00Z",
  "updatedAt": "2026-04-07T10:30:00Z"
}
```

---

### 3. Assign Ticket to Technician
**Endpoint:** `PATCH /api/v1/tickets/{id}/assign`  
**Permission:** `ASSIGN_TICKETS` (ADMIN only)

**Already Implemented:**
- File: `TicketController.java` lines 68-77
- File: `TicketService.java` lines 132-165
- Validates technician has TECHNICIAN role
- Sets due date for accountability
- Sends notification to assigned technician
- Records status change in history

**Example Request:**
```http
PATCH /api/v1/tickets/550e8400-e29b-41d4-a716-446655440000/assign
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "assignedTechId": "tech-uuid-here",
  "dueDate": "2026-04-10"
}
```

**Response:**
```json
{
  "ticketId": "550e8400-e29b-41d4-a716-446655440000",
  "assignedTech": {
    "userId": "tech-uuid-here",
    "fullName": "Mike Johnson",
    "email": "mike.tech@university.edu"
  },
  "dueDate": "2026-04-10",
  "status": "OPEN",
  ...
}
```

**Backend Logic:**
1. Validates ticket exists and admin has permission
2. Validates `assignedTechId` is a valid user with TECHNICIAN role
3. Updates ticket with assignee and due date
4. Creates notification for technician: "You have been assigned to Ticket #550e8400..."
5. Records status history: "Assigned to Mike Johnson"
6. Returns updated ticket

---

### 4. Update Ticket Status
**Endpoint:** `PATCH /api/v1/tickets/{id}/status`  
**Permission:** `UPDATE_TICKET_STATUS` (ADMIN, TECHNICIAN)

**Already Implemented:**
- File: `TicketController.java` lines 79-88
- File: `TicketService.java` lines 167-245
- Enforces state machine transitions
- ADMIN can move to any status (including REJECTED)
- Notifies reporter on status changes
- Auto-sets `resolvedAt` timestamp when status → RESOLVED

**Valid Transitions:**
```
OPEN → IN_PROGRESS (tech starts work)
OPEN → REJECTED (admin rejects with reason)
OPEN → CLOSED (admin closes without work)

IN_PROGRESS → RESOLVED (tech completes work)
IN_PROGRESS → CLOSED (admin closes early)

RESOLVED → CLOSED (admin verifies and closes)
RESOLVED → IN_PROGRESS (issue reoccurred, reopen)

CLOSED → (terminal state, cannot change)
REJECTED → (terminal state, cannot change)
```

**Example Request (Admin rejects ticket):**
```http
PATCH /api/v1/tickets/550e8400-e29b-41d4-a716-446655440000/status
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "newStatus": "REJECTED",
  "note": "Duplicate of ticket #123. Please see that ticket for updates."
}
```

**Response:**
```json
{
  "ticketId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "REJECTED",
  "resolutionNotes": "Duplicate of ticket #123...",
  ...
}
```

**Backend Logic:**
1. Validates current status allows transition to `newStatus`
2. Updates ticket status
3. If status = RESOLVED, sets `resolvedAt` timestamp
4. Creates status history entry with note
5. Notifies reporter: "Your ticket status changed to REJECTED"
6. Returns updated ticket

---

### 5. Close Ticket
**Endpoint:** `PATCH /api/v1/tickets/{id}/status` (with status=CLOSED)  
**Permission:** `CLOSE_TICKETS` (ADMIN only)

Same as Update Status above, but only ADMIN can transition to CLOSED.

**Example Request:**
```http
PATCH /api/v1/tickets/550e8400-e29b-41d4-a716-446655440000/status
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "newStatus": "CLOSED",
  "note": "Issue verified resolved. Closing ticket."
}
```

---

### 6. Add Comment to Any Ticket
**Endpoint:** `POST /api/v1/tickets/{id}/comments`  
**Permission:** No specific permission (all authenticated users can comment on tickets they have access to)

**Already Implemented:**
- File: `TicketController.java` lines 90-104
- File: `TicketService.java` lines 247-280
- Admin can comment on ANY ticket (due to VIEW_ALL_TICKETS permission)
- Comments include author info and timestamps
- Notifies ticket reporter and assigned tech

**Example Request:**
```http
POST /api/v1/tickets/550e8400-e29b-41d4-a716-446655440000/comments
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "content": "Checked with IT department. Replacement projector will arrive tomorrow."
}
```

**Response:**
```json
{
  "commentId": "comment-uuid",
  "author": {
    "userId": "admin-uuid",
    "fullName": "Admin Smith",
    "email": "admin@university.edu"
  },
  "content": "Checked with IT department. Replacement projector will arrive tomorrow.",
  "createdAt": "2026-04-07T11:15:00Z",
  "updatedAt": "2026-04-07T11:15:00Z"
}
```

**Backend Logic:**
1. Validates admin has access to ticket (passes due to VIEW_ALL_TICKETS)
2. Creates comment with admin as author
3. Notifies reporter: "Admin Smith commented on your ticket"
4. Notifies assigned tech (if any): "Admin Smith added a comment"
5. Returns created comment

---

## Frontend Implementation Plan (0% → 100%)

### Step 1: Create Admin Ticket List Page
**File:** `frontend/src/pages/admin/AllTicketsPage.tsx`

**Components Needed:**
- TanStack Table with pagination
- Filter dropdowns (status, priority, category)
- Search box (by description, reporter name)
- Status badges (color-coded)
- Priority badges
- Assign button (per row)
- View details button (per row)

**Features:**
```tsx
- [ ] Pagination controls (page 0-N)
- [ ] Status filter dropdown (OPEN, IN_PROGRESS, etc.)
- [ ] Priority filter dropdown (LOW, MEDIUM, HIGH, CRITICAL)
- [ ] Category filter dropdown (IT, ELECTRICAL, etc.)
- [ ] Assignee filter (Unassigned, Specific Tech)
- [ ] Click row → navigate to ticket detail
- [ ] Quick assign button → open assign dialog
- [ ] Color-coded status badges
- [ ] Sort by createdAt, priority
```

---

### Step 2: Create Ticket Detail Page
**File:** `frontend/src/pages/admin/TicketDetailPage.tsx`

**Sections:**
1. **Header:** Ticket #ID, Status badge, Priority badge
2. **Resource Info:** Name, type, location (linked)
3. **Reporter Info:** Name, email, **contact email**, **contact phone** ← NEW
4. **Description:** Full text, category
5. **Assigned Tech:** Name or "Unassigned" + Assign button
6. **Due Date:** Display or "Not set"
7. **Attachments:** Image gallery (up to 3)
8. **Comments:** Threaded view with timestamps
9. **Status History:** Timeline of all transitions
10. **Admin Actions:**
    - Assign to Technician button
    - Change Status dropdown
    - Add Comment textarea + button
    - Close Ticket button (only if RESOLVED)

---

### Step 3: Create Assign Ticket Dialog
**File:** `frontend/src/components/tickets/AssignTicketDialog.tsx`

**Form Fields:**
- Technician dropdown (fetches users with TECHNICIAN role)
- Due date picker (date-fns + input[type=date])
- Notes textarea (optional)

**Validation (Zod):**
```tsx
const assignSchema = z.object({
  assignedTechId: z.string().uuid("Select a technician"),
  dueDate: z.string().min(1, "Due date required").refine(
    (date) => new Date(date) >= new Date(),
    "Due date must be in the future"
  ),
  note: z.string().optional()
});
```

**On Submit:**
```tsx
const assignMutation = useMutation({
  mutationFn: (data) => ticketsApi.assign(ticketId, data),
  onSuccess: () => {
    toast.success("Ticket assigned successfully");
    queryClient.invalidateQueries(['tickets', ticketId]);
    onClose();
  }
});
```

---

### Step 4: Create Update Status Dialog
**File:** `frontend/src/components/tickets/UpdateStatusDialog.tsx`

**Form Fields:**
- Status dropdown (shows only valid transitions based on current status)
- Resolution notes textarea (required if changing to RESOLVED/CLOSED/REJECTED)

**Dynamic Options:**
```tsx
const getValidStatuses = (currentStatus) => {
  const transitions = {
    OPEN: ['IN_PROGRESS', 'REJECTED', 'CLOSED'],
    IN_PROGRESS: ['RESOLVED', 'CLOSED'],
    RESOLVED: ['CLOSED', 'IN_PROGRESS'],
    CLOSED: [],  // Terminal
    REJECTED: [] // Terminal
  };
  return transitions[currentStatus] || [];
};
```

**Validation:**
```tsx
const statusSchema = z.object({
  newStatus: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']),
  note: z.string().min(1, "Note required").max(500)
});
```

---

### Step 5: Create Add Comment Component
**File:** `frontend/src/components/tickets/AddCommentForm.tsx`

**Simple textarea + submit:**
```tsx
const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000)
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(commentSchema)
});

const addCommentMutation = useMutation({
  mutationFn: (data) => ticketsApi.addComment(ticketId, data),
  onSuccess: () => {
    toast.success("Comment added");
    queryClient.invalidateQueries(['tickets', ticketId]);
    reset(); // Clear textarea
  }
});
```

---

### Step 6: Create Status Badge Component
**File:** `frontend/src/components/tickets/TicketStatusBadge.tsx`

**Color mapping:**
```tsx
const statusColors = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800'
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn('px-2 py-1 rounded text-xs font-medium', statusColors[status])}>
      {status}
    </span>
  );
}
```

---

### Step 7: Create Priority Badge Component
**File:** `frontend/src/components/tickets/TicketPriorityBadge.tsx`

**Color mapping:**
```tsx
const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700'
};
```

---

### Step 8: Wire Up API Client
**File:** `frontend/src/api/tickets.ts`

```tsx
export const ticketsApi = {
  // List with filters
  list: (params: TicketListParams) => 
    api.get('tickets', { searchParams: params }).json<PageResponse<TicketSummaryResponse>>(),
  
  // Get single ticket
  getById: (id: string) => 
    api.get(`tickets/${id}`).json<TicketResponse>(),
  
  // Assign ticket (ADMIN)
  assign: (id: string, data: AssignTicketRequest) => 
    api.patch(`tickets/${id}/assign`, { json: data }).json<TicketResponse>(),
  
  // Update status (ADMIN, TECH)
  updateStatus: (id: string, data: UpdateStatusRequest) => 
    api.patch(`tickets/${id}/status`, { json: data }).json<TicketResponse>(),
  
  // Add comment
  addComment: (id: string, data: AddCommentRequest) => 
    api.post(`tickets/${id}/comments`, { json: data }).json<TicketCommentResponse>(),
  
  // Update comment (owner only)
  updateComment: (ticketId: string, commentId: string, data: UpdateCommentRequest) => 
    api.put(`tickets/${ticketId}/comments/${commentId}`, { json: data }).json<TicketCommentResponse>(),
  
  // Delete comment (owner only)
  deleteComment: (ticketId: string, commentId: string) => 
    api.delete(`tickets/${ticketId}/comments/${commentId}`).json()
};
```

---

### Step 9: Create TanStack Query Hooks
**File:** `frontend/src/hooks/useTickets.ts`

```tsx
export function useTickets(params: TicketListParams) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketsApi.list(params)
  });
}

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketsApi.getById(id!),
    enabled: !!id
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignTicketRequest }) => 
      ticketsApi.assign(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries(['tickets', id]);
      queryClient.invalidateQueries(['tickets']); // Refresh list
    }
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatusRequest }) => 
      ticketsApi.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries(['tickets', id]);
      queryClient.invalidateQueries(['tickets']);
    }
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddCommentRequest }) => 
      ticketsApi.addComment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries(['tickets', id]);
    }
  });
}
```

---

### Step 10: Add Routes & Navigation
**File:** `frontend/src/router.tsx`

```tsx
const ticketsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/tickets',
  beforeLoad: ({ context }) => {
    requirePermission(context, PERMISSIONS.VIEW_ALL_TICKETS);
  },
  component: AllTicketsPage
});

const ticketDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/tickets/$ticketId',
  beforeLoad: ({ context }) => {
    requirePermission(context, PERMISSIONS.VIEW_ALL_TICKETS);
  },
  component: TicketDetailPage
});
```

**File:** `frontend/src/components/layout/Sidebar.tsx`

```tsx
{hasPermission(PERMISSIONS.VIEW_ALL_TICKETS) && (
  <Link to="/tickets" className="nav-link">
    <TicketIcon className="w-5 h-5" />
    <span>All Tickets</span>
  </Link>
)}
```

---

## Testing Workflow (Admin-Side)

### Manual Testing Script

#### Setup
1. Create admin user (or use existing from seed data)
2. Create 5-10 test tickets as a regular user
3. Login as admin

#### Test Cases

**TC1: View All Tickets**
- Navigate to `/tickets`
- Should see all tickets in the system (not just your own)
- Verify pagination works (if > 20 tickets)
- Verify filters: status=OPEN, priority=HIGH, category=IT
- Verify search works

**TC2: View Ticket Detail**
- Click on a ticket row
- Should navigate to `/tickets/{id}`
- Verify all sections render:
  - Resource info
  - Reporter info with **contact email & phone**
  - Description
  - Attachments (if any)
  - Comments (if any)
  - Status history
- Verify admin action buttons visible

**TC3: Assign Ticket**
- Click "Assign to Technician" button
- Select technician from dropdown
- Set due date (tomorrow)
- Submit
- Verify ticket updates to show assigned tech
- Verify technician receives notification

**TC4: Update Status (OPEN → IN_PROGRESS)**
- Click "Change Status" button
- Select "IN_PROGRESS"
- Enter note: "Assigned to tech, work started"
- Submit
- Verify status badge changes to yellow "IN_PROGRESS"
- Verify status history shows new entry
- Verify reporter receives notification

**TC5: Update Status (IN_PROGRESS → RESOLVED)**
- Click "Change Status"
- Select "RESOLVED"
- Enter resolution notes: "Replaced projector bulb. Tested working."
- Submit
- Verify status = RESOLVED (green badge)
- Verify `resolvedAt` timestamp set
- Verify reporter notified

**TC6: Close Ticket**
- (From RESOLVED state)
- Click "Close Ticket" button
- Confirm action
- Verify status = CLOSED (gray badge)
- Verify cannot change status anymore (terminal state)

**TC7: Reject Ticket**
- On a new OPEN ticket
- Click "Change Status" → "REJECTED"
- Enter reason: "Out of scope. Please contact Facilities directly."
- Submit
- Verify status = REJECTED (red badge)
- Verify reporter notified with rejection reason

**TC8: Add Comment**
- Scroll to comments section
- Type: "Contacted facilities team. They will handle replacement."
- Submit
- Verify comment appears with your name and timestamp
- Verify reporter + assigned tech notified (if any)

---

## Implementation Checklist

### Backend (Already Complete ✅)
- [x] GET /tickets - list with filters
- [x] GET /tickets/{id} - detail view
- [x] PATCH /tickets/{id}/assign - assign to tech
- [x] PATCH /tickets/{id}/status - update status
- [x] POST /tickets/{id}/comments - add comment
- [x] PUT /tickets/{id}/comments/{commentId} - edit comment
- [x] DELETE /tickets/{id}/comments/{commentId} - delete comment
- [x] Role-based access control (ADMIN permissions)
- [x] Notification creation on all actions
- [x] Status history tracking
- [x] Contact fields in DTOs

### Frontend (To Implement ⏳)
- [ ] `src/api/tickets.ts` - API client
- [ ] `src/hooks/useTickets.ts` - TanStack Query hooks
- [ ] `src/types/api.ts` - Add ticket types (mirror backend DTOs)
- [ ] `src/pages/admin/AllTicketsPage.tsx` - List view
- [ ] `src/pages/admin/TicketDetailPage.tsx` - Detail view
- [ ] `src/components/tickets/AssignTicketDialog.tsx` - Assign form
- [ ] `src/components/tickets/UpdateStatusDialog.tsx` - Status change form
- [ ] `src/components/tickets/AddCommentForm.tsx` - Comment input
- [ ] `src/components/tickets/TicketStatusBadge.tsx` - Status visual
- [ ] `src/components/tickets/TicketPriorityBadge.tsx` - Priority visual
- [ ] `src/router.tsx` - Add routes with permission guards
- [ ] `src/components/layout/Sidebar.tsx` - Add "All Tickets" nav link
- [ ] `src/lib/permissions.ts` - Verify ticket permissions exported

### Testing
- [ ] Manual testing: View all tickets
- [ ] Manual testing: Filter/search tickets
- [ ] Manual testing: Assign ticket
- [ ] Manual testing: Update status (all transitions)
- [ ] Manual testing: Add comment
- [ ] Manual testing: Verify notifications sent
- [ ] Integration tests: `TicketIntegrationTest.java` (create 5-10 test methods)

---

## Time Estimates

| Task | Estimated Time |
|------|----------------|
| API client + hooks | 1 hour |
| AllTicketsPage (table + filters) | 2-3 hours |
| TicketDetailPage (full view) | 2-3 hours |
| AssignTicketDialog | 1 hour |
| UpdateStatusDialog | 1.5 hours |
| AddCommentForm | 30 minutes |
| Badge components | 30 minutes |
| Routes + navigation | 30 minutes |
| Manual testing | 1-2 hours |
| Integration tests | 2-3 hours |
| **TOTAL** | **12-16 hours** |

---

## Key Design Decisions

### 1. Contact Details Display
**Where to show:**
- ✅ Ticket detail page (prominent section)
- ✅ Ticket list page (hover tooltip or expandable row)
- ❌ Not in table columns (too much clutter)

### 2. Assign Dialog UX
**Technician selection:**
- Fetch all users with TECHNICIAN role
- Group by department (if available)
- Show name + email for disambiguation
- Searchable dropdown (shadcn Select)

### 3. Status Transitions
**Validation:**
- Frontend validates before API call (better UX)
- Backend enforces (security)
- Show only valid next statuses in dropdown
- Disable "Change Status" if terminal state (CLOSED/REJECTED)

### 4. Comment Threads
**Display:**
- Reverse chronological (newest first)
- Avatar + name + timestamp
- Edit/Delete buttons only if comment.author.userId === currentUserId
- Admin can see all comments but not edit others' comments

### 5. Notifications
**Admin actions that trigger notifications:**
- Assign ticket → notify technician
- Update status → notify reporter
- Add comment → notify reporter + assigned tech
- Close ticket → notify reporter
- Reject ticket → notify reporter

---

## API Integration Notes

### Authentication
All admin endpoints require:
```typescript
headers: {
  'Authorization': `Bearer ${authStore.getState().accessToken}`
}
```

The `ky` client in `src/api/client.ts` already handles this automatically.

### Error Handling
Backend returns standardized errors:
```json
{
  "timestamp": "2026-04-07T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid ticket status transition",
  "path": "/api/v1/tickets/uuid/status",
  "fieldErrors": null
}
```

Frontend should:
```tsx
onError: (error) => {
  const message = error.response?.json()?.message || 'An error occurred';
  toast.error(message);
}
```

### Optimistic Updates
For better UX, use optimistic updates:
```tsx
const updateStatusMutation = useMutation({
  mutationFn: ticketsApi.updateStatus,
  onMutate: async ({ id, data }) => {
    await queryClient.cancelQueries(['tickets', id]);
    const previous = queryClient.getQueryData(['tickets', id]);
    
    // Optimistically update
    queryClient.setQueryData(['tickets', id], (old) => ({
      ...old,
      status: data.newStatus
    }));
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['tickets', variables.id], context.previous);
  }
});
```

---

## Next Steps After Admin Implementation

1. **User-side ticket creation** (Member 3)
   - CreateTicketPage.tsx
   - Upload attachments (max 3 images)
   - Validate contact fields

2. **Technician-side views** (Member 3)
   - MyAssignedTicketsPage.tsx
   - Update status (IN_PROGRESS → RESOLVED only)
   - Add resolution notes

3. **Integration testing** (Member 3)
   - Testcontainers
   - REST Assured
   - Cover all happy paths + error cases

4. **Documentation** (Team)
   - Update api_doc.md with examples
   - Update user-journeys.md with screenshots
   - Create video demo for viva

---

## Conclusion

This guide provides everything needed to implement the Admin-side ticket management UI. The backend is 100% complete and tested, so frontend development can proceed in parallel with other features.

**Priority:** Start with AllTicketsPage and TicketDetailPage — these are the foundation. Dialogs can be added incrementally.

**Next document:** `member3_user_implementation_guide.md` (user ticket creation flow)
