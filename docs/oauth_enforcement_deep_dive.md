# OAuth Enforcement Deep Dive

## 1. Purpose
This document explains exactly how Google OAuth is enforced in the current app implementation, with code-level references for each control point.

It covers:
- Frontend initiation of OAuth
- Callback handling and code exchange request
- Backend Google token exchange and user info retrieval
- User upsert and role assignment
- JWT issuance after OAuth login
- How OAuth is integrated into Spring Security configuration
- OAuth-specific gaps and recommended hardening

## 2. OAuth Mode Used by This App
The active login path is SPA-driven Authorization Code flow:
1. Frontend redirects user to Google auth endpoint.
2. Google redirects back to frontend callback with authorization code.
3. Frontend sends code to backend `/auth/google`.
4. Backend exchanges code with Google, fetches user info, upserts user, and returns app JWT tokens.

Evidence:
- Frontend Google auth URL builder: [frontend/src/pages/LoginPage.tsx#L18](../frontend/src/pages/LoginPage.tsx#L18)
- Frontend callback processor: [frontend/src/pages/OAuthCallback.tsx#L23](../frontend/src/pages/OAuthCallback.tsx#L23)
- Backend exchange endpoint: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L65](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L65)
- Backend code exchange service: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L121](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L121)

## 3. Step-by-Step OAuth Enforcement Chain

### Step 1: Browser Sends User to Google
Frontend generates Google OAuth URL with:
- `client_id`
- `redirect_uri`
- `response_type=code`
- `scope=openid email profile`
- `access_type=offline`
- `prompt=select_account`

Evidence:
- URL parameter construction: [frontend/src/pages/LoginPage.tsx#L19](../frontend/src/pages/LoginPage.tsx#L19)
- Google endpoint used: [frontend/src/pages/LoginPage.tsx#L27](../frontend/src/pages/LoginPage.tsx#L27)
- Redirect trigger: [frontend/src/pages/LoginPage.tsx#L95](../frontend/src/pages/LoginPage.tsx#L95)

Enforcement role:
- Only Google can issue the code.
- Browser never receives backend client secret.

### Step 2: Frontend Callback Validates Basic OAuth Response Shape
Frontend callback page:
- Reads `code` and `error` from URL params.
- Fails fast on missing code or explicit Google denial.
- Sends `{ code, redirectUri }` to backend auth endpoint.

Evidence:
- Parse callback params: [frontend/src/pages/OAuthCallback.tsx#L23](../frontend/src/pages/OAuthCallback.tsx#L23)
- Error handling for denied access: [frontend/src/pages/OAuthCallback.tsx#L27](../frontend/src/pages/OAuthCallback.tsx#L27)
- Missing code check: [frontend/src/pages/OAuthCallback.tsx#L32](../frontend/src/pages/OAuthCallback.tsx#L32)
- Backend call with code + redirect URI: [frontend/src/pages/OAuthCallback.tsx#L38](../frontend/src/pages/OAuthCallback.tsx#L38)

### Step 3: Backend Accepts OAuth Code Exchange Request
`POST /auth/google` accepts a validated request object:
- `code` required
- `redirectUri` required

Evidence:
- Endpoint method: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L65](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L65)
- DTO validation for code + redirect URI: [backend/src/main/java/com/smartcampus/backend/dto/auth/LoginRequest.java#L6](../backend/src/main/java/com/smartcampus/backend/dto/auth/LoginRequest.java#L6)

SecurityConfig allows this endpoint publicly (as expected for login entry):
- [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L53](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L53)

### Step 4: Backend Exchanges Code with Google Token Endpoint
Backend calls Google token endpoint:
- URL: `https://oauth2.googleapis.com/token`
- Sends: `code`, `client_id`, `client_secret`, `redirect_uri`, `grant_type=authorization_code`
- Rejects if Google exchange fails

Evidence:
- Token endpoint constant: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L44](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L44)
- Client credentials loaded from config: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L48](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L48)
- Exchange payload parameters: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L181](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L181)
- Google exchange error handling: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L195](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L195)

### Step 5: Backend Fetches Google User Profile
After token exchange, backend calls Google user info API with Google access token.

Evidence:
- Extract Google access token from exchange response: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L124](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L124)
- UserInfo endpoint constant: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L45](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L45)
- Bearer auth header to Google userinfo endpoint: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L208](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L208)

### Step 6: Backend Upserts User and Assigns Default Role
Backend upsert logic:
- Match by `(oauthProvider, oauthProviderId)` or by email.
- If user exists, profile data is updated.
- If new, user is created and assigned default `USER` role.

Evidence:
- Upsert entry: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L133](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L133)
- Existing-user matching logic: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L231](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L231)
- Default role lookup: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L246](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L246)
- New user role assignment: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L260](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L260)

### Step 7: Backend Issues App JWT Pair and Returns AuthResponse
After OAuth identity is accepted and user is materialized:
- App access token created with roles and permissions claims.
- App refresh token created with token type `REFRESH`.
- AuthResponse returned to frontend.

Evidence:
- JWT pair issuance from OAuth path: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L277](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L277)
- Access token generation details and claims: [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L67](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L67)
- Refresh token generation (`typ=REFRESH`): [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L84](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L84), [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L92](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L92)
- AuthResponse shape: [backend/src/main/java/com/smartcampus/backend/dto/auth/AuthResponse.java#L6](../backend/src/main/java/com/smartcampus/backend/dto/auth/AuthResponse.java#L6)

### Step 8: Frontend Stores Session and Navigates
Frontend stores tokens and authenticated user info, then routes to dashboard.

Evidence:
- Token persistence after OAuth login: [frontend/src/api/auth.ts#L16](../frontend/src/api/auth.ts#L16), [frontend/src/api/auth.ts#L17](../frontend/src/api/auth.ts#L17)
- Set user in auth store after callback success: [frontend/src/pages/OAuthCallback.tsx#L40](../frontend/src/pages/OAuthCallback.tsx#L40)
- Redirect to dashboard: [frontend/src/pages/OAuthCallback.tsx#L41](../frontend/src/pages/OAuthCallback.tsx#L41)

## 4. Spring Security OAuth Integration (Secondary Path)
Besides SPA code-exchange, backend also has built-in Spring OAuth2 login wiring:
- OAuth2 routes permitted: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L54](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L54)
- `oauth2Login(...)` enabled with custom user service: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L59](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L59), [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L60](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L60)
- Success redirect target configured: [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L61](../backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java#L61), [backend/src/main/resources/application.properties#L53](../backend/src/main/resources/application.properties#L53)
- Google OAuth client registration properties: [backend/src/main/resources/application.properties#L32](../backend/src/main/resources/application.properties#L32)

Custom OAuth2 user service behavior:
- Loads provider attributes and upserts user: [backend/src/main/java/com/smartcampus/backend/security/CustomOAuth2UserService.java#L36](../backend/src/main/java/com/smartcampus/backend/security/CustomOAuth2UserService.java#L36)
- Assigns default role for new users: [backend/src/main/java/com/smartcampus/backend/security/CustomOAuth2UserService.java#L68](../backend/src/main/java/com/smartcampus/backend/security/CustomOAuth2UserService.java#L68)

## 5. OAuth-Specific Security Controls Currently Present
1. Authorization Code grant is used (not implicit token flow).
- Evidence: [frontend/src/pages/LoginPage.tsx#L22](../frontend/src/pages/LoginPage.tsx#L22), [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L185](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L185)

2. Google client secret remains backend-only.
- Evidence: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L51](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L51)

3. OAuth login request payload is validated.
- Evidence: [backend/src/main/java/com/smartcampus/backend/dto/auth/LoginRequest.java#L6](../backend/src/main/java/com/smartcampus/backend/dto/auth/LoginRequest.java#L6)

4. Google exchange/userinfo failures are rejected as unauthorized.
- Evidence: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L197](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L197), [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L220](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L220)

5. App authorization does not trust Google token directly; it uses first-party JWT after user upsert.
- Evidence: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L280](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L280), [backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L38](../backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L38)

## 6. OAuth Gaps and Hardening Recommendations
These are important items you likely want to enforce next.

1. Missing `state` parameter and callback `state` verification.
- OAuth URL currently has no `state`: [frontend/src/pages/LoginPage.tsx#L19](../frontend/src/pages/LoginPage.tsx#L19)
- Callback validates `code`/`error` only: [frontend/src/pages/OAuthCallback.tsx#L23](../frontend/src/pages/OAuthCallback.tsx#L23)
- Add cryptographically random state to mitigate CSRF/login CSRF.

2. No PKCE parameters (`code_challenge`, `code_verifier`) in SPA flow.
- Evidence: [frontend/src/pages/LoginPage.tsx#L19](../frontend/src/pages/LoginPage.tsx#L19)
- Add PKCE to harden code interception scenarios.

3. Redirect URI from client is trusted without explicit whitelist check.
- Request carries redirect URI: [backend/src/main/java/com/smartcampus/backend/dto/auth/LoginRequest.java#L9](../backend/src/main/java/com/smartcampus/backend/dto/auth/LoginRequest.java#L9)
- Passed directly to Google token exchange: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L184](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L184)
- Add strict whitelist validation against known frontend callback URLs.

4. Refresh token still stored in localStorage after OAuth login.
- Evidence: [frontend/src/api/auth.ts#L17](../frontend/src/api/auth.ts#L17)
- Prefer HttpOnly cookie-only refresh strategy.

5. Refresh cookie is set insecurely for production defaults.
- `setSecure(false)`: [backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L75](../backend/src/main/java/com/smartcampus/backend/controller/AuthController.java#L75)
- No SameSite assignment present.

6. Revocation list for refresh token JTIs is in-memory only.
- Evidence: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L61](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L61)
- Move to Redis/DB for multi-instance and restart-safe behavior.

## 7. Quick Verification Checklist for OAuth Enforcement
1. Initiate Google login and confirm redirect URL includes `response_type=code`: [frontend/src/pages/LoginPage.tsx#L22](../frontend/src/pages/LoginPage.tsx#L22)
2. Confirm callback page sends `code` + `redirectUri` to backend: [frontend/src/pages/OAuthCallback.tsx#L38](../frontend/src/pages/OAuthCallback.tsx#L38)
3. Confirm backend exchanges code with Google and fetches userinfo: [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L122](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L122), [backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L126](../backend/src/main/java/com/smartcampus/backend/service/AuthService.java#L126)
4. Confirm app JWT includes permissions and role claims: [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L77](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L77), [backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L78](../backend/src/main/java/com/smartcampus/backend/security/JwtTokenProvider.java#L78)
5. Confirm protected API calls work only with valid app JWT and fail with 401/403 otherwise: [backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L38](../backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java#L38), [backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L38](../backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java#L38)
