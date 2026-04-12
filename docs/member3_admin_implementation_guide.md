# Member 3 - Admin Side Implementation Plan
## Phase-by-Phase Implementation Guide

> **Focus:** Admin ticket management features  
> **Date:** 2026-04-08  
> **Order:** Database → Backend → Frontend

---

## 🎯 ADMIN CAPABILITIES (What admins need to do)

✅ View ALL tickets (not filtered by reporter)  
✅ Assign technicians to tickets  
✅ Set ticket status to REJECTED with reason  
✅ Update any ticket status  
✅ Close tickets  
✅ Delete inappropriate comments (admin override)  
✅ View complete ticket history and audit trail

---

## 📋 QUICK START CHECKLIST

### **Phase 1: Database** (30 min)
- [ ] Create V1.1 Flyway migration for contact fields
- [ ] Run `docker-compose up` to apply migration
- [ ] Verify tables in pgAdmin

### **Phase 2: Entities** (2 hours)
- [ ] Create Ticket.java entity
- [ ] Create TicketStatusHistory.java
- [ ] Create TicketComment.java
- [ ] Create TicketAttachment.java
- [ ] Create TicketStatus.java enum
- [ ] Create TicketPriority.java enum
- [ ] Create 4 repositories

### **Phase 3: DTOs** (1 hour)
- [ ] AssignTicketRequest
- [ ] UpdateTicketStatusRequest
- [ ] TicketResponse
- [ ] TicketDetailResponse
- [ ] Supporting DTOs

### **Phase 4: Services** (4 hours)
- [ ] TicketService with admin methods
- [ ] State machine validator
- [ ] Integration with NotificationService

### **Phase 5: Controller** (2 hours)
- [ ] TicketController with @PreAuthorize
- [ ] Admin-specific endpoints

### **Phase 6: Frontend** (4 hours)
- [ ] API client layer
- [ ] Admin pages and components

---

## 📁 FILES TO CREATE (Complete List)

```
backend/src/main/resources/db/migration/
└── V1.1__add_ticket_contact_fields.sql

backend/src/main/java/com/smartcampus/backend/
├── model/
│   ├── Ticket.java
│   ├── TicketStatusHistory.java
│   ├── TicketComment.java
│   ├── TicketAttachment.java
│   └── enums/
│       ├── TicketStatus.java
│       └── TicketPriority.java
├── repository/
│   ├── TicketRepository.java
│   ├── TicketStatusHistoryRepository.java
│   ├── TicketCommentRepository.java
│   └── TicketAttachmentRepository.java
├── dto/ticket/
│   ├── AssignTicketRequest.java
│   ├── UpdateTicketStatusRequest.java
│   ├── TicketResponse.java
│   ├── TicketDetailResponse.java
│   ├── TicketStatusHistoryResponse.java
│   ├── TicketCommentResponse.java
│   └── TicketAttachmentResponse.java
├── service/
│   └── TicketService.java
├── controller/
│   └── TicketController.java
└── mapper/
    └── TicketMapper.java

frontend/src/
├── api/
│   └── tickets.ts
├── hooks/
│   └── useTickets.ts
├── pages/
│   ├── admin/
│   │   └── AllTicketsPage.tsx
│   └── TicketDetailPage.tsx
└── components/tickets/
    ├── TicketAssignDialog.tsx
    ├── TicketStatusBadge.tsx
    └── TicketFilters.tsx
```

**Total Files: 30+**

---

## ⏱️ TIME ESTIMATE

| Phase | Duration | Complexity |
|-------|----------|------------|
| Database migration | 30 min | Easy |
| Entities + Repos | 2 hours | Medium |
| DTOs | 1 hour | Easy |
| Services | 4 hours | Hard |
| Controller | 2 hours | Medium |
| Frontend | 4 hours | Medium |
| **TOTAL** | **~14 hours** | **2 days** |

---

## 🚀 LET'S START: PRIORITY ORDER

Since you want to implement admin side first, here's the exact order:

### **TODAY (Day 1): Backend Foundation**
1. ✅ Database migration
2. ✅ All 6 entities
3. ✅ All 4 repositories
4. ✅ DTOs

### **TOMORROW (Day 2): Backend Logic**
5. ✅ TicketService (admin methods)
6. ✅ TicketController (admin endpoints)
7. ✅ Test with Postman

### **DAY 3: Frontend**
8. ✅ API client
9. ✅ Admin pages
10. ✅ UI components

---

Would you like me to:

**Option A:** Provide all the code files one by one (I'll create each complete file)

**Option B:** Create a step-by-step tutorial starting with the migration

**Option C:** Generate all files at once in a single response

Which approach works best for you? 🎯
