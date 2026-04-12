# Member 3 - PDF Assignment vs Implementation Plan
## Gap Analysis Report

> **Date:** 2026-04-08  
> **Source:** IT3030 PAF Assignment 2026 PDF  
> **Module:** Module C – Maintenance & Incident Ticketing

---

## 📋 PDF ASSIGNMENT REQUIREMENTS (Module C)

### **Exact Requirements from PDF:**

> **Module C – Maintenance & Incident Ticketing**
> - Users can create incident tickets for a specific resource/location with **category**, **description**, **priority**, and **preferred contact details**.
> - Tickets can include **up to 3 image attachments** (evidence such as a damaged projector or error screen).
> - Ticket workflow: **OPEN → IN_PROGRESS → RESOLVED → CLOSED** (Admin may also set **REJECTED** with reason).
> - A **technician (or staff member)** can be assigned to a ticket and can **update status** and add **resolution notes**.
> - **Users and staff can add comments**; **comment ownership rules** must be implemented (**edit/delete** as appropriate).

---

## ✅ REQUIREMENTS COVERAGE

| # | PDF Requirement | Our Plan | Status | Notes |
|---|----------------|----------|--------|-------|
| 1 | Users create tickets | ✅ M3-B04 | **COVERED** | Only USERS can create (corrected) |
| 2 | For specific resource/location | ✅ M3-B04 | **COVERED** | `resource_id` FK in tickets table |
| 3 | **Category** field | ✅ M3-B01 | **COVERED** | `category VARCHAR(100)` |
| 4 | **Description** field | ✅ M3-B01 | **COVERED** | `description TEXT` |
| 5 | **Priority** field | ✅ M3-B01 | **COVERED** | `priority ticket_priority` enum |
| 6 | ⚠️ **Preferred contact details** | ❌ | **GAP FOUND** | Not in schema or plan |
| 7 | ⚠️ **Up to 3 image attachments** | ⚠️ M3-B09 | **PARTIAL** | No 3-limit validation in plan |
| 8 | Workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED | ✅ M3-B10 | **COVERED** | State machine |
| 9 | Admin can set REJECTED with reason | ✅ M3-B06 | **COVERED** | REJECTED in enum + validation |
| 10 | Technician assigned to ticket | ✅ M3-B05 | **COVERED** | `assigned_tech_id` |
| 11 | Technician updates status | ✅ M3-B06 | **COVERED** | UPDATE_TICKET_STATUS permission |
| 12 | Technician adds resolution notes | ✅ M3-B06 | **COVERED** | `resolution_notes TEXT` |
| 13 | Users and staff can add comments | ✅ M3-B08 | **COVERED** | Comment service with BOLA |
| 14 | ⚠️ **Comment ownership (edit/delete)** | ❌ | **GAP FOUND** | Only CREATE planned, not UPDATE/DELETE |

---

## 🚨 GAPS IDENTIFIED

### **GAP 1: Preferred Contact Details** ❌ CRITICAL

**PDF Requirement:**
> "with category, description, priority, and **preferred contact details**"

**Current Schema:**
```sql
-- tickets table DOES NOT HAVE contact fields
CREATE TABLE tickets (
    ticket_id UUID PRIMARY KEY,
    resource_id UUID NOT NULL,
    reporter_id UUID NOT NULL,  -- We have user FK
    ...
    -- MISSING: preferred_contact_email, preferred_contact_phone
);
```

**Impact:** User cannot specify how they want to be contacted about the ticket.

**Solution Required:**

**Option A: Add to tickets table (Recommended)**
```sql
ALTER TABLE tickets 
ADD COLUMN preferred_contact_email VARCHAR(150),
ADD COLUMN preferred_contact_phone VARCHAR(20);
```

**Option B: Use reporter's profile info**
- Reporter's email is already in `users.email`
- Could add `phone` to users table
- No additional fields needed in tickets

**Recommendation:** **Option A** — Allows user to specify different contact (e.g., their supervisor's email for urgent issues)

---

### **GAP 2: 3 Image Attachment Limit** ⚠️ HIGH

**PDF Requirement:**
> "Tickets can include **up to 3 image attachments**"

**Current Plan:**
- M3-B09: File upload endpoint (no limit mentioned)
- `ticket_attachments` table allows unlimited rows per ticket

**Impact:** System could allow 10+ attachments when requirement is max 3.

**Solution Required:**

**Backend Validation (M3-B09):**
```java
// In TicketService.uploadAttachment()
public AttachmentResponse uploadAttachment(UUID ticketId, MultipartFile file) {
    // Check existing attachment count
    long existingCount = attachmentRepository.countByTicketId(ticketId);
    if (existingCount >= 3) {
        throw new BadRequestException("Maximum 3 attachments allowed per ticket");
    }
    
    // Validate file is an image
    if (!isImageFile(file)) {
        throw new BadRequestException("Only image files are allowed");
    }
    
    // Rest of upload logic...
}
```

**Frontend Validation (M3-F07):**
```tsx
// In TicketForm / FileUploadComponent
const MAX_ATTACHMENTS = 3;

const [attachments, setAttachments] = useState<File[]>([]);

const handleFileSelect = (files: File[]) => {
  if (attachments.length + files.length > MAX_ATTACHMENTS) {
    toast.error(`Maximum ${MAX_ATTACHMENTS} images allowed`);
    return;
  }
  
  // Validate all are images
  const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
  if (invalidFiles.length > 0) {
    toast.error('Only image files are allowed');
    return;
  }
  
  setAttachments([...attachments, ...files]);
};
```

**Additional Requirement:** PDF says "image attachments" — need to restrict to images only (no PDFs!)

---

### **GAP 3: Comment Edit/Delete** ⚠️ HIGH

**PDF Requirement:**
> "**comment ownership rules** must be implemented (**edit/delete** as appropriate)"

**Current Plan:**
- M3-B08: Add comment service — **CREATE only**
- No UPDATE endpoint
- No DELETE endpoint

**Impact:** Users cannot correct typos or remove inappropriate comments.

**Solution Required:**

#### **Additional Backend Tasks Needed:**

**M3-B08A: Update Comment Service (NEW)**
```java
// In TicketService
public CommentResponse updateComment(UUID commentId, String newContent, UUID currentUserId) {
    TicketComment comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
    
    // Ownership check: only author can edit
    if (!comment.getAuthorId().equals(currentUserId)) {
        throw new ForbiddenException("You can only edit your own comments");
    }
    
    // Optional: time limit for editing (e.g., 15 minutes)
    if (comment.getCreatedAt().isBefore(Instant.now().minus(15, ChronoUnit.MINUTES))) {
        throw new BadRequestException("Comments can only be edited within 15 minutes of posting");
    }
    
    comment.setContent(newContent);
    comment.setUpdatedAt(Instant.now());
    return commentMapper.toResponse(commentRepository.save(comment));
}
```

**M3-B08B: Delete Comment Service (NEW)**
```java
public void deleteComment(UUID commentId, UUID currentUserId) {
    TicketComment comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
    
    // Author can delete OR admin can delete
    User currentUser = securityUtils.getCurrentUser();
    boolean isAuthor = comment.getAuthorId().equals(currentUserId);
    boolean isAdmin = hasPermission(currentUser, "VIEW_ALL_TICKETS"); // Admin permission
    
    if (!isAuthor && !isAdmin) {
        throw new ForbiddenException("You can only delete your own comments");
    }
    
    commentRepository.delete(comment);
}
```

**M3-B11A: Additional Controller Endpoints (NEW)**
```java
@PutMapping("/{ticketId}/comments/{commentId}")
@PreAuthorize("hasAuthority('COMMENT_ON_OWN_TICKET') or hasAuthority('COMMENT_ON_ASSIGNED_TICKET')")
public ResponseEntity<CommentResponse> updateComment(
    @PathVariable UUID ticketId,
    @PathVariable UUID commentId,
    @RequestBody @Valid UpdateCommentRequest request
) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    return ResponseEntity.ok(ticketService.updateComment(commentId, request.getContent(), currentUserId));
}

@DeleteMapping("/{ticketId}/comments/{commentId}")
@PreAuthorize("hasAuthority('COMMENT_ON_OWN_TICKET') or hasAuthority('COMMENT_ON_ASSIGNED_TICKET') or hasAuthority('VIEW_ALL_TICKETS')")
public ResponseEntity<Void> deleteComment(
    @PathVariable UUID ticketId,
    @PathVariable UUID commentId
) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    ticketService.deleteComment(commentId, currentUserId);
    return ResponseEntity.noContent().build();
}
```

#### **Additional Frontend Tasks Needed:**

**M3-F05A: Comment Edit/Delete UI (NEW)**
```tsx
// In TicketCommentThread component
const CommentItem = ({ comment, currentUserId, isAdmin }) => {
  const isAuthor = comment.author.userId === currentUserId;
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="comment">
      {isEditing ? (
        <CommentEditForm 
          comment={comment} 
          onSave={handleSave} 
          onCancel={() => setIsEditing(false)} 
        />
      ) : (
        <>
          <p>{comment.content}</p>
          {isAuthor && (
            <div className="comment-actions">
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-3 w-3" /> Edit
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={handleDelete}
              >
                <Trash className="h-3 w-3" /> Delete
              </Button>
            </div>
          )}
          {isAdmin && !isAuthor && (
            <Button size="sm" variant="ghost" onClick={handleDelete}>
              <Trash className="h-3 w-3" /> Remove (Admin)
            </Button>
          )}
        </>
      )}
    </div>
  );
};
```

---

### **GAP 4: REJECTED Status in Workflow** ✅ PARTIALLY COVERED

**PDF Requirement:**
> "OPEN → IN_PROGRESS → RESOLVED → CLOSED (Admin may also set **REJECTED** with reason)"

**Current Plan:**
- ✅ REJECTED is in `ticket_status` enum (schema.sql)
- ✅ M3-B10 state machine validation
- ✅ M3-B06 rejection reason handling

**Additional Clarification Needed:**
The PDF says "Admin may also set REJECTED" — when can this happen?

**Recommended Transitions:**
```
OPEN → REJECTED (Admin rejects invalid/duplicate ticket)
IN_PROGRESS → REJECTED (Tech determines issue is not fixable/out of scope)
```

**Current Plan Already Has:**
```java
// From our state machine (M3-B10)
OPEN → [IN_PROGRESS, REJECTED, CLOSED]
IN_PROGRESS → [RESOLVED, CLOSED]
RESOLVED → [CLOSED, IN_PROGRESS]
```

✅ **Already covered** — REJECTED transition from OPEN is supported

---

## 📝 UPDATED TASK LIST

### **NEW TASKS TO ADD:**

#### **Backend:**

| # | New Task | Priority | Sprint | Depends On |
|---|----------|----------|--------|------------|
| **M3-B01A** | Add `preferred_contact_email` and `preferred_contact_phone` to Ticket entity | P0 | 1 | M3-B01 |
| **M3-B03A** | Add `countByTicketId()` to AttachmentRepository | P0 | 3 | M3-B03 |
| **M3-B08A** | Implement `updateComment()` service with ownership check | P1 | 3 | M3-B08 |
| **M3-B08B** | Implement `deleteComment()` service with author/admin check | P1 | 3 | M3-B08 |
| **M3-B09A** | Add 3-attachment limit validation in upload service | P0 | 3 | M3-B09 |
| **M3-B09B** | Restrict upload to images only (no PDFs) | P0 | 3 | M3-B09 |
| **M3-B11A** | Add PUT `/tickets/{id}/comments/{commentId}` endpoint | P1 | 3 | M3-B11, M3-B08A |
| **M3-B11B** | Add DELETE `/tickets/{id}/comments/{commentId}` endpoint | P1 | 3 | M3-B11, M3-B08B |

#### **Frontend:**

| # | New Task | Priority | Sprint | Depends On |
|---|----------|----------|--------|------------|
| **M3-F03A** | Add contact email/phone fields to TicketForm | P0 | 3 | M3-F03 |
| **M3-F05A** | Add Edit/Delete buttons to CommentItem component | P1 | 3 | M3-F05 |
| **M3-F05B** | Implement CommentEditForm inline editor | P1 | 3 | M3-F05 |
| **M3-F05C** | Add delete confirmation dialog for comments | P1 | 3 | M3-F05 |
| **M3-F07A** | Enforce 3-attachment limit in FileUploadZone | P0 | 3 | M3-F07 |
| **M3-F07B** | Restrict file picker to images only (accept="image/*") | P0 | 3 | M3-F07 |

---

## 🔄 UPDATED DATABASE MIGRATION

### **Flyway Migration V1A (NEW) — Add Contact Fields**

```sql
-- V1.1__add_ticket_contact_fields.sql

ALTER TABLE tickets 
ADD COLUMN preferred_contact_email VARCHAR(150),
ADD COLUMN preferred_contact_phone VARCHAR(20);

COMMENT ON COLUMN tickets.preferred_contact_email IS 'Optional: reporter can specify different contact email';
COMMENT ON COLUMN tickets.preferred_contact_phone IS 'Optional: reporter can specify contact phone number';
```

---

## 🔄 UPDATED DTO

### **CreateTicketRequest (Updated)**

```java
package com.smartcampus.backend.dto.ticket;

import jakarta.validation.constraints.*;

public record CreateTicketRequest(
    @NotNull(message = "Resource ID is required")
    UUID resourceId,
    
    @NotBlank(message = "Category is required")
    @Size(max = 100)
    String category,
    
    @NotBlank(message = "Description is required")
    @Size(min = 10, message = "Description must be at least 10 characters")
    String description,
    
    @NotNull(message = "Priority is required")
    TicketPriority priority,
    
    // NEW FIELDS
    @Email(message = "Invalid email format")
    @Size(max = 150)
    String preferredContactEmail,     // Optional, defaults to reporter's email
    
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid phone number format")
    String preferredContactPhone      // Optional
) {}
```

---

## 📊 FINAL COVERAGE SUMMARY

| Requirement Category | Before Analysis | After Fixes | Status |
|---------------------|----------------|-------------|--------|
| **Core Ticket Fields** | 4/5 | 5/5 | ✅ 100% |
| **Attachment Management** | Partial | Complete | ✅ 100% |
| **Workflow & Status** | Complete | Complete | ✅ 100% |
| **Comment Management** | 1/3 | 3/3 | ✅ 100% |
| **Role-based Access** | Complete | Complete | ✅ 100% |
| **Notifications** | Complete | Complete | ✅ 100% |

---

## ✅ ACTION ITEMS

### **Immediate (Sprint 1):**
1. ✅ Update `Ticket` entity with contact fields
2. ✅ Create migration V1.1 for contact columns
3. ✅ Update `CreateTicketRequest` DTO

### **Sprint 3:**
4. ✅ Implement 3-attachment limit validation
5. ✅ Restrict uploads to images only
6. ✅ Implement comment UPDATE service
7. ✅ Implement comment DELETE service  
8. ✅ Add PUT/DELETE comment endpoints
9. ✅ Update TicketForm with contact fields
10. ✅ Add edit/delete UI to comments
11. ✅ Enforce attachment limits in frontend

### **Testing (Sprint 5):**
12. ✅ Test attachment limit (try uploading 4th image)
13. ✅ Test comment edit within time window
14. ✅ Test comment delete (author vs admin)
15. ✅ Test image-only upload restriction

---

## 🎯 CONCLUSION

**Original Coverage:** 11/14 requirements (78.5%)  
**Updated Coverage:** 14/14 requirements (100%) ✅

**Critical Gaps Found:** 3
1. ❌ Missing preferred contact fields (FIXED)
2. ⚠️ No 3-attachment limit (FIXED)
3. ⚠️ No comment edit/delete (FIXED)

**Total New Tasks:** 13 tasks (6 backend + 7 frontend)  
**Priority Distribution:**
- P0 (Critical): 6 tasks
- P1 (High): 7 tasks

**The implementation plan now FULLY covers all PDF assignment requirements for Module C.** 🚀

---

## 📋 CHECKLIST FOR MEMBER 3

- [ ] Read this gap analysis document
- [ ] Update Ticket entity with contact fields
- [ ] Create Flyway migration for new columns
- [ ] Update DTOs with new fields
- [ ] Implement attachment count validation
- [ ] Implement image-only upload restriction
- [ ] Implement comment UPDATE service
- [ ] Implement comment DELETE service
- [ ] Add comment edit/delete endpoints
- [ ] Update frontend form with contact fields
- [ ] Add edit/delete buttons to comments UI
- [ ] Test all new features
- [ ] Update API documentation
- [ ] Update README with new fields

**Ready to implement with 100% requirement coverage!** ✨
