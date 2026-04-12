# API 403 Forbidden Error — Diagnostic Guide

## Problem
Getting `403 Forbidden` errors when accessing `/api/v1/users` and `/api/v1/roles` from admin account.

## Root Causes (Check Each)

### 1. Backend Not Running ⚠️
**Check:**
```bash
# Is Docker container running?
docker ps | grep backend

# Check backend logs
docker-compose logs backend
```

**Solution:**
```bash
cd D:\Assignment\it3030-paf-2026-smart-campus-groupXX
docker-compose up --build
```

---

### 2. Admin User Lacks Permissions 🔒
**Check admin user permissions:**
```sql
-- Connect to PostgreSQL (via pgAdmin or psql)
SELECT u.email, r.role_name, r.permissions
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
WHERE u.email = 'your-admin-email@example.com';
```

**Expected output:**
```
email                  | role_name | permissions
-----------------------+-----------+----------------------------------
admin@smartcampus.local| ADMIN     | {VIEW_ALL_USERS, MANAGE_USERS, ...}
```

**Solution if missing:**
```sql
-- Assign ADMIN role to your user
INSERT INTO user_roles (user_id, role_id)
VALUES (
  (SELECT user_id FROM users WHERE email = 'your-email@example.com'),
  (SELECT role_id FROM roles WHERE role_name = 'ADMIN')
)
ON CONFLICT DO NOTHING;
```

---

### 3. JWT Token Missing Required Permissions 🎟️
**Check token in browser:**
1. Open DevTools → Application → Local Storage → `http://localhost:5173`
2. Find key `sc_access_token`
3. Copy token and decode at https://jwt.io

**Check claims:**
```json
{
  "sub": "user-uuid",
  "email": "your-email@example.com",
  "permissions": [
    "VIEW_ALL_USERS",
    "MANAGE_USERS",
    "VIEW_ALL_ROLES",
    ...
  ]
}
```

**Solution if permissions missing:**
- Logout and login again to get fresh token
- Or manually refresh token

---

### 4. CORS Issues (Unlikely but possible) 🌐
**Check backend logs for:**
```
WARN ... CORS preflight check failed
```

**Check CORS config** in `backend/src/main/java/com/smartcampus/backend/config/CorsConfig.java`:
```java
.allowedOrigins("http://localhost:5173")
.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE")
.allowedHeaders("*")
.allowCredentials(true)
```

---

### 5. Wrong API Endpoint 🎯
**Verify endpoints exist:**
```bash
# Check Swagger UI
http://localhost:8080/api/v1/swagger-ui.html

# Look for:
- GET /api/v1/users
- GET /api/v1/roles
```

---

## Quick Fix Steps

### Step 1: Restart Backend
```bash
cd D:\Assignment\it3030-paf-2026-smart-campus-groupXX
docker-compose down
docker-compose up --build -d
```

### Step 2: Check Backend is Healthy
```bash
# Check container status
docker-compose ps

# Should see:
# backend    Up (healthy)
# postgres   Up (healthy)
```

### Step 3: Test API Directly
Open a new browser tab (or use curl):
```bash
# Get your token from DevTools → Local Storage → sc_access_token

# Test users endpoint
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8080/api/v1/users?page=0&size=20

# Test roles endpoint
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8080/api/v1/roles
```

**Expected:** JSON response with user/role data  
**If 403:** Token lacks permissions (see Step 4)  
**If 401:** Token expired (logout and login again)  
**If connection refused:** Backend not running

### Step 4: Check Your User Permissions
```bash
# Access PostgreSQL via pgAdmin
http://localhost:5050
# Login: admin@smartcampus.local / admin
# Server: smartcampus-db

# Or via Docker:
docker exec -it it3030-paf-2026-smart-campus-groupxx-postgres-1 psql -U smartcampus

# Then run:
SELECT u.email, u.is_active, r.role_name, r.permissions
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.role_id
WHERE u.email = 'YOUR_EMAIL_HERE';
```

**What to look for:**
- `is_active` = true
- `role_name` = 'ADMIN' (or at least one role)
- `permissions` array contains 'VIEW_ALL_USERS' and 'VIEW_ALL_ROLES'

### Step 5: If No Roles Assigned
Your user exists but has **no roles**. This happens when:
- You used "Sign Up" (public registration → no role assigned)
- You used Google OAuth (new users → default USER role)

**Solution A: Assign ADMIN role via SQL**
```sql
-- Find your user ID
SELECT user_id, email, full_name FROM users WHERE email = 'your-email@example.com';

-- Assign ADMIN role
INSERT INTO user_roles (user_id, role_id)
VALUES (
  'YOUR_USER_ID_FROM_ABOVE',
  (SELECT role_id FROM roles WHERE role_name = 'ADMIN')
);
```

**Solution B: Use seed admin account**
The backend seeds an admin account on first startup:
- Email: `admin@smartcampus.local`
- Password: `admin123` (set in V2 migration)

Login with this account, then:
1. Go to User Management
2. Find your user
3. Click "Assign Roles"
4. Select "ADMIN"
5. Logout and login with your account

### Step 6: Clear Cache and Re-login
```javascript
// Open DevTools → Console
localStorage.clear();
location.reload();
// Then login again
```

---

## Verify Permissions Required

### UserManagementPage requires:
- `VIEW_ALL_USERS` — to list users
- `MANAGE_USERS` — to assign roles, deactivate users

### RoleManagementPage requires:
- `VIEW_ALL_ROLES` — to list roles
- `MANAGE_ROLES` — to create/edit/delete roles

### Check ADMIN role has these:
```sql
SELECT permissions FROM roles WHERE role_name = 'ADMIN';
```

**Expected:**
```
{
  VIEW_ALL_USERS,
  MANAGE_USERS,
  VIEW_ALL_ROLES,
  MANAGE_ROLES,
  VIEW_ALL_TICKETS,
  ASSIGN_TICKETS,
  CLOSE_TICKETS,
  ... (14 total permissions)
}
```

---

## Still Getting 403?

### Enable Debug Logging
**Backend:** `application.properties`
```properties
logging.level.com.smartcampus.backend.security=DEBUG
logging.level.org.springframework.security=DEBUG
```

**Restart backend:**
```bash
docker-compose restart backend
```

**Check logs:**
```bash
docker-compose logs -f backend
```

Look for:
```
DEBUG ... Access is denied (user lacks authority: VIEW_ALL_USERS)
```

### Check Security Config
File: `backend/src/main/java/com/smartcampus/backend/controller/UserController.java`

Line ~30:
```java
@GetMapping
@PreAuthorize("hasAuthority('VIEW_ALL_USERS')")
public ResponseEntity<PageResponse<UserResponse>> listUsers(...)
```

This means your JWT **must** contain `"VIEW_ALL_USERS"` in the permissions array.

---

## Common Scenarios

### Scenario 1: "I just signed up with Google OAuth"
**Problem:** New Google OAuth users get USER role only (not ADMIN).

**Solution:**
1. Login with seed admin (`admin@smartcampus.local` / `admin123`)
2. Go to User Management
3. Find your Google account
4. Assign ADMIN role
5. Logout and login with Google account again

### Scenario 2: "I used the Sign Up form"
**Problem:** Public registration creates users with **no roles** (security measure).

**Solution:** Same as Scenario 1.

### Scenario 3: "I'm getting 403 on some pages but not others"
**Problem:** Inconsistent permissions.

**Check:**
- Dashboard works? → You have basic USER permissions
- User Management fails? → Missing `VIEW_ALL_USERS`
- Role Management fails? → Missing `VIEW_ALL_ROLES`

**Solution:** Check your exact permissions in JWT token and database.

### Scenario 4: "Backend logs show 'Access Denied'"
**Problem:** Security filter is blocking request.

**Check logs for:**
```
Access is denied (user=user@example.com lacks authority: VIEW_ALL_USERS)
```

**Solution:** Assign correct role with required permissions.

---

## Prevention

### For Development:
1. Always use seed admin account first: `admin@smartcampus.local` / `admin123`
2. Create your personal admin user via User Management page
3. Never rely on public signup for admin access

### For Production:
1. Disable public signup or require email verification
2. Admin users must be created via database or admin panel only
3. Implement role request workflow (user requests → admin approves)

---

## Contact Details for This Project

**Admin Seed Account:**
- Email: `admin@smartcampus.local`
- Password: `admin123`
- Permissions: All 14 permissions

**Backend URL:** `http://localhost:8080`  
**Frontend URL:** `http://localhost:5173`  
**Swagger UI:** `http://localhost:8080/api/v1/swagger-ui.html`  
**pgAdmin:** `http://localhost:5050` (admin@smartcampus.local / admin)

---

## Next Steps After Fix

Once you can access User Management:
1. ✅ Verify users list loads
2. ✅ Verify roles list loads
3. ✅ Try assigning a role to a test user
4. ✅ Test ticket creation as regular user
5. ✅ Test ticket assignment as admin

---

## TL;DR — Most Likely Fix

```bash
# 1. Ensure backend is running
docker-compose up --build

# 2. Login with seed admin account
Email: admin@smartcampus.local
Password: admin123

# 3. Assign ADMIN role to your user account
# (via User Management UI)

# 4. Logout and login with your account
# 5. Should work now ✅
```
