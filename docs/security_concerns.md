# Security Concerns & Mitigations

> Smart Campus Resource Management Platform  
> Last updated: 2026-03-04

---

## 1. Authentication & Session Security

### 1.1 OAuth 2.0 (Google)

| Concern | Mitigation |
|---------|-----------|
| Authorization code interception | Use PKCE (`code_challenge` + `code_verifier`) on the OAuth flow. Spring Security 7 supports PKCE out of the box. |
| Open redirect after login | Validate `redirect_uri` against a whitelist in `application.properties`. Never accept arbitrary redirect URLs. |
| Token theft from Google | Exchange code server-side only (authorization code flow, NOT implicit). Never expose Google tokens to the browser. |
| Account takeover via email change | Google's `email_verified` claim must be `true`. Reject unverified emails. |

### 1.2 JWT Tokens

| Concern | Mitigation |
|---------|-----------|
| Token theft (XSS) | Store access token in memory (Zustand store), **NOT** in `localStorage`. Store refresh token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. |
| Token expiry | Short-lived access tokens (15 min). Refresh tokens expire in 7 days. Implement silent refresh via `/auth/refresh`. |
| JWT signing | Use RS256 (asymmetric) with a 2048-bit RSA key pair. Public key available at `/.well-known/jwks.json` for verification. |
| Token revocation | Maintain a server-side blocklist (in-memory or Redis) for revoked refresh tokens. Check on every `/auth/refresh` call. |
| JWT payload leakage | Never put sensitive data (password hashes, secrets) in JWT claims. Only include `userId`, `email`, `roles`, `permissions`. |

### 1.3 Session Fixation

| Concern | Mitigation |
|---------|-----------|
| Pre-auth session reuse | Not applicable — we use stateless JWT, no server sessions. |
| CSRF | SPA with JWT in `Authorization` header is inherently CSRF-safe. Disable CSRF in Spring Security for API routes (`csrf.ignoringRequestMatchers("/api/**")`). |

---

## 2. Authorization & Access Control

### 2.1 Role-Based Access Control (RBAC)

| Concern | Mitigation |
|---------|-----------|
| Privilege escalation | All endpoints use `@PreAuthorize("hasAuthority('PERMISSION_NAME')")`. Permissions are loaded from the `roles.permissions` array, not hardcoded. |
| Broken object-level auth (BOLA) | Service methods always check that the requesting user owns the resource they're accessing: `booking.getUserId().equals(currentUser.getId())` or user has `VIEW_ALL_BOOKINGS` permission. |
| Mass assignment | Use dedicated `*Request` DTOs that only accept intended fields. Never bind directly to JPA entities. |
| Horizontal privilege escalation | Filter all list queries by `user_id` unless the user has admin-level permissions. Enforce at repository/service layer, not just frontend. |

### 2.2 Permission Checks

```java
// Controller level
@PreAuthorize("hasAuthority('APPROVE_BOOKINGS')")
@PatchMapping("/{bookingId}/approve")
public BookingResponse approveBooking(...) { ... }

// Service level (defense in depth)
if (!currentUser.hasPermission("APPROVE_BOOKINGS")) {
    throw new UnauthorizedActionException("Cannot approve bookings");
}
```

---

## 3. Input Validation & Injection

### 3.1 SQL Injection

| Concern | Mitigation |
|---------|-----------|
| Raw SQL queries | **Never** use string concatenation for queries. Use Spring Data JPA repository methods, `@Query` with named parameters (`:paramName`), or Criteria API. |
| Native queries | If absolutely necessary, always use parameterized queries: `@Query(value = "SELECT * FROM resources WHERE type = :type", nativeQuery = true)` |

### 3.2 XSS (Cross-Site Scripting)

| Concern | Mitigation |
|---------|-----------|
| Stored XSS in ticket descriptions / comments | React auto-escapes rendered content. Never use `dangerouslySetInnerHTML`. |
| API responses | Set `Content-Type: application/json` on all API responses. Spring Boot does this by default. |
| CSP header | Add `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` via Spring Security headers config. |

### 3.3 Server-Side Validation

```java
public record BookingRequest(
    @NotNull UUID resourceId,
    @NotNull @FutureOrPresent LocalDate bookingDate,
    @NotNull LocalTime startTime,
    @NotNull LocalTime endTime,
    @NotBlank @Size(max = 1000) String purpose,
    @Positive Integer expectedAttendees
) {}
```

- All `@Valid` annotations on controller method parameters.
- Custom validators for business rules (e.g., `endTime > startTime`).
- `GlobalExceptionHandler` catches `MethodArgumentNotValidException` and returns structured `fieldErrors`.

---

## 4. Data Protection

### 4.1 Sensitive Data

| Data | Storage | Protection |
|------|---------|-----------|
| Passwords (if local auth added) | `users.password_hash` | BCrypt with cost factor 12+ |
| Google OAuth tokens | Never stored | Exchanged server-side, discarded after extracting user info |
| JWT signing keys | `application-prod.properties` or env vars | RSA private key in PKCS#8 PEM, excluded from Git (`.gitignore`) |
| User PII (email, name) | PostgreSQL | Encrypted at rest (PG `pgcrypto` or disk-level encryption) |
| File uploads | Cloud storage / local dir | Pre-signed URLs with expiry; files not served from application server |

### 4.2 Database Security

| Concern | Mitigation |
|---------|-----------|
| Database credentials in code | Use environment variables or Spring Cloud Vault. Never commit `spring.datasource.password` in plain text. |
| Connection security | Use SSL/TLS for JDBC connections: `spring.datasource.url=jdbc:postgresql://host:5432/db?sslmode=require` |
| Least privilege | Application DB user should only have `SELECT`, `INSERT`, `UPDATE`, `DELETE` on application tables. No `CREATE`, `DROP`, `ALTER` (Flyway uses a separate migration user). |
| Soft deletes | Users are soft-deleted (`is_active = FALSE`), preserving referential integrity and audit trail. |

---

## 5. File Upload Security

| Concern | Mitigation |
|---------|-----------|
| Unrestricted file types | Whitelist allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. Reject everything else. |
| File size | Limit to 10MB per file. Configure in Spring: `spring.servlet.multipart.max-file-size=10MB`. |
| Path traversal | Generate random UUIDs for filenames. Never use user-supplied filenames for storage paths. |
| Malware | Scan uploaded files with ClamAV or similar before persisting. At minimum, validate MIME type matches file magic bytes. |
| Direct access | Serve files via pre-signed URLs (if using S3/GCS) or through an authenticated API endpoint that checks permissions. |

---

## 6. API Security

### 6.1 Rate Limiting

| Endpoint | Limit | Library |
|----------|-------|---------|
| `POST /auth/google` | 10 requests / minute / IP | Spring Cloud Gateway RateLimiter or Bucket4j |
| `POST /auth/refresh` | 20 requests / minute / user | Bucket4j |
| `POST /bookings` | 30 requests / minute / user | Bucket4j |
| `POST /tickets` | 20 requests / minute / user | Bucket4j |
| All other endpoints | 100 requests / minute / user | Bucket4j |

### 6.2 CORS

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:5173")); // dev
    // In prod: List.of("https://smartcampus.university.edu")
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    // ...
}
```

### 6.3 Security Headers

```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives(
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https:; connect-src 'self' https://accounts.google.com"
    ))
    .frameOptions(frame -> frame.deny())
    .contentTypeOptions(Customizer.withDefaults())               // X-Content-Type-Options: nosniff
    .referrerPolicy(ref -> ref.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
    .permissionsPolicy(perms -> perms.policy("camera=(), microphone=(), geolocation=()"))
);
```

---

## 7. Logging & Monitoring

| Concern | Mitigation |
|---------|-----------|
| Sensitive data in logs | Never log passwords, tokens, or full request bodies. Use `@ToString.Exclude` on sensitive fields. |
| Audit trail | `ticket_status_history` table tracks all ticket state changes with who + when. `bookings.reviewed_by/reviewed_at` tracks approval. |
| Failed login attempts | Log failed OAuth callbacks. After 5 failures from same IP in 10 min, block temporarily. |
| Monitoring | Spring Boot Actuator exposes `/actuator/health`, `/actuator/metrics`. Protect with admin-only access. |

---

## 8. Dependency Security

| Concern | Mitigation |
|---------|-----------|
| Vulnerable dependencies | Run `mvn org.owasp:dependency-check-maven:check` in CI pipeline. |
| NPM vulnerabilities | Run `npm audit` and `npm audit fix` regularly. Pin major versions. |
| Supply chain attacks | Use `package-lock.json` and `mvnw` wrapper with verified checksums. |

---

## 9. Deployment Security

| Concern | Mitigation |
|---------|-----------|
| Secrets in Docker images | Use multi-stage builds. Pass secrets via environment variables at runtime, never bake into the image. |
| HTTPS | Terminate TLS at reverse proxy (Nginx/Caddy) or cloud load balancer. Backend serves plain HTTP inside the network. |
| Database access | Place PostgreSQL in a private subnet. Only the backend can reach it on port 5432. |
| Environment isolation | Separate databases for dev, staging, and production. Never share credentials. |

---

## 10. Security Checklist (Pre-Launch)

- [ ] OAuth 2.0 + PKCE enabled, redirect URI whitelisted
- [ ] JWT access tokens are short-lived (≤ 15 min)
- [ ] Refresh tokens stored in HttpOnly cookies
- [ ] All API endpoints have `@PreAuthorize` with correct permissions
- [ ] BOLA checks in every service method (owner or admin)
- [ ] Input validation on every request DTO (`@Valid` + Zod on frontend)
- [ ] No raw SQL — all queries are parameterized
- [ ] File upload: type whitelist, size limit, no path traversal
- [ ] CORS restricted to known origins
- [ ] CSP, X-Content-Type-Options, X-Frame-Options headers set
- [ ] Rate limiting on auth and create endpoints
- [ ] No secrets committed to Git (`.gitignore` covers `*.pem`, `.env`)
- [ ] OWASP dependency check passing
- [ ] `npm audit` clean
- [ ] Actuator endpoints secured (admin only)
- [ ] Database credentials via env vars, not in config files
- [ ] PostgreSQL connection over SSL
