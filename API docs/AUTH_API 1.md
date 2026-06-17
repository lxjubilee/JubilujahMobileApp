# Jubilujah Authentication API

Reference for the account flows exposed by the Jubilujah identity API:
**sign up, sign in, forgot password, reset password, change password, and delete account.**

- **Production base URL:** `https://api.jubilujah.com`
- **Web app origin:** `https://jubilujah.com`
- **Router prefix:** all endpoints below are mounted under `/api/auth`
- **Source of truth:** `app/api/src/routes/auth.js`

> Examples use the production host. For local development substitute
> `http://localhost:4000` (API) and `http://localhost:3000` (web).

> **Deployment status (2026-06-16):** all endpoints below are deployed and live on
> `api.jubilujah.com` (verified end-to-end through Cloudflare → nginx → the `jubilujah-api`
> process). The database schema (migrations `0001`–`0006`) is fully applied.
> **Email delivery is configured and working** via SendGrid (`@sendgrid/mail`). Auth
> emails (sign-up code, login/2FA OTP, password reset) currently send **from
> `no-reply@jubileeinspire.com`** — the SendGrid account's authenticated domain — while
> the message body remains Jubilujah.com-branded. To send from `no-reply@jubilujah.com`,
> authenticate the `jubilujah.com` domain in SendGrid (add the CNAME records in
> Cloudflare) and set `EMAIL_FROM` accordingly, then `pm2 restart jubilujah-api`.
>
> The **server-to-server** admin auth (§11–§12) is also live, now on **client-credentials HS256 JWTs** (the old static `ADMIN_SERVICE_TOKENS` has been removed). The JubileeInspire integration must obtain a JWT from `POST /api/auth/service/token` before calling the admin routes — see §11.4.

---

## 1. Conventions

### Request format
- Send and accept JSON: `Content-Type: application/json`, `Accept: application/json`.
- Request bodies are capped at **256 KB**.
- All field names are **camelCase** unless noted (`change-password` uses snake_case — see that section).

### Authentication = session cookie
The **user-facing** API (§3–§8) uses an **opaque, server-side session** delivered as an HttpOnly cookie — there is **no bearer token / `Authorization` header** on these flows.

> The **server-to-server** admin endpoints (§11–§12) are the exception: they use a short-lived **Bearer JWT** (`Authorization: Bearer <jwt>`) obtained via client-credentials, and are *not* part of the cookie/CSRF model.

| Cookie | Purpose | Flags |
|--------|---------|-------|
| `jv_session` | Session credential. Set on successful sign-in / sign-up; cleared on logout & account deletion. | HttpOnly, `SameSite=Lax`, `Secure` (prod), `Path=/` |
| `jv_csrf` | CSRF double-submit token. Readable by JS. | **not** HttpOnly, `SameSite=Lax`, `Secure` (prod) |

Sessions last **12 hours** by default (`SESSION_TTL_HOURS`).

Because auth is cookie-based, **every request must send cookies**:
- Browser `fetch`: `credentials: 'include'`
- `curl`: use a cookie jar (`-c cookies.txt -b cookies.txt`)

### CSRF protection (required on every mutation)
The API uses **double-submit-cookie** CSRF protection. For any **non-GET** request (`POST`, `DELETE`, …) you must:

1. Read the `jv_csrf` cookie value (issued automatically on your first request to the API).
2. Send it back in the **`X-CSRF-Token`** header.

If the header is missing or does not match the cookie, the request is rejected with **`403 CSRF token missing or invalid`**.

> Tip: make any GET request first (e.g. `GET /api/auth/me`) to receive the `jv_csrf` cookie, then echo it on subsequent mutations.

### CORS
Browser requests must come from an allow-listed origin (`CORS_ORIGIN`, e.g. `https://jubilujah.com`). Credentialed CORS is enabled, so the client must set `credentials: 'include'`.

### Rate limiting
All `/api/auth/*` routes share a limiter: **50 requests per 15 minutes per IP**. Exceeding it returns **`429`** with standard `RateLimit-*` headers. Individual flows add their own throttles (OTP resend cooldowns, lockouts) described per-endpoint.

### Error shape
Errors return a JSON body:

```json
{ "error": "error", "message": "Human-readable reason" }
```

- `error` is one of `error`, `unauthorized` (401), `forbidden` (403), `conflict` (409), `unprocessable` (422), `not_found` (404), `internal` (500).
- Validation failures (`400`) add an `issues` array: `[{ "path": "email", "message": "Invalid email" }]`.
- Some flows add extra fields (e.g. `attemptsRemaining`, `cooldownSeconds`, `lockedUntil`). These are documented per-endpoint.

---

## 2. Endpoint summary

| Flow | Method & path | Auth | CSRF |
|------|---------------|------|------|
| Sign up — request code | `POST /api/auth/signup` | none | yes |
| Sign up — verify & create | `POST /api/auth/verify-signup` | none | yes |
| Sign up — resend code | `POST /api/auth/send-signup-verification` | none | yes |
| Sign in | `POST /api/auth/signin` | none | yes |
| Sign in — verify OTP | `POST /api/auth/verify-login` | none | yes |
| Sign in — resend OTP | `POST /api/auth/send-login-verification` | none | yes |
| Forgot password | `POST /api/auth/forgot-password` | none | yes |
| Reset password | `POST /api/auth/reset-password` | none | yes |
| Change password | `POST /api/auth/change-password` | **session** | yes |
| Delete account | `DELETE /api/auth/account` | **session** | yes |
| Current user | `GET /api/auth/me` | optional | no |
| Logout | `POST /api/auth/logout` | session | yes |
| Logout everywhere | `POST /api/auth/logout-all` | **session** | yes |

**Server-to-server** (different auth model — Bearer JWT, no cookie/CSRF; see §11–§12):

| Flow | Method & path | Auth | CSRF |
|------|---------------|------|------|
| Get service token | `POST /api/auth/service/token` | client credentials | no |
| Admin — set password | `POST /api/auth/admin/set-password` | **service JWT** (`admin.set_password`) | no |
| Admin — provision user | `POST /api/auth/admin/provision-user` | **service JWT** (`admin.provision`) | no |

---

## 3. Sign up

Sign-up is a **two-phase, email-verified** flow. The account is **not** created until the emailed 6-digit code is confirmed, so an unverified email never yields an account.

```
POST /signup ───► email contains 6-digit code ───► POST /verify-signup ───► account created + session
       │                                                    ▲
       └────────── POST /send-signup-verification ──────────┘  (resend code)
```

### 3.1 `POST /api/auth/signup` — request a verification code

Validates the details, stores a pending sign-up, and emails a 6-digit code. **No account exists yet.**

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | 1–120 chars |
| `email` | string | valid email, ≤254 chars (stored lowercase) |
| `password` | string | 8–200 chars |

```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "correct horse battery" }
```

**Success — `200 OK`**
```json
{
  "success": true,
  "requiresVerification": true,
  "email": "ada@example.com",
  "verificationGuid": "3f1c2b9e-5d4a-4c8e-9b1a-0f2e3d4c5b6a"
}
```
Keep `verificationGuid` — it identifies this sign-up in phase 2.

**Errors**
- `409` — an active account already exists for that email (`"...already exists. Please sign in."`).
- `400` — validation failed (`issues` array included).

The verification code expires in **30 minutes**; up to **5** wrong attempts per code.

---

### 3.2 `POST /api/auth/verify-signup` — confirm the code & create the account

On success the account is created, a session cookie is set (the user is **logged in**), and the email is treated as verified.

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `verificationGuid` | string (UUID) | from `/signup` |
| `verificationCode` | string | exactly 6 digits |
| `rememberMe` | boolean | optional |

```json
{ "verificationGuid": "3f1c2b9e-…-5b6a", "verificationCode": "048213" }
```

**Success — `201 Created`** (sets `jv_session` cookie)
```json
{ "user": { "id": "…", "email": "ada@example.com", "displayName": "Ada Lovelace" } }
```

**Errors**
- `400` — invalid/expired verification, code already used, expired code, or wrong code. Wrong code includes `attemptsRemaining`:
  ```json
  { "error": "error", "message": "Incorrect code. 3 attempt(s) left.", "attemptsRemaining": 3 }
  ```
- `429` — too many attempts; start sign-up again.
- `409` — email was claimed in the meantime.

---

### 3.3 `POST /api/auth/send-signup-verification` — resend the sign-up code

Issues a fresh code for an in-progress sign-up.

**Request body**: `{ "verificationGuid": "3f1c2b9e-…-5b6a" }`

**Success — `200 OK`**
```json
{ "success": true, "verificationGuid": "3f1c2b9e-…-5b6a", "resendsRemaining": 1 }
```

**Throttling / errors**
- `429` with `cooldownSeconds` — must wait **60 s** between resends.
- `429` with `"exhausted": true` — resend cap reached (**2 resends → 3 codes total**); start sign-up again.
- `400` — invalid GUID, or sign-up already completed.

---

## 4. Sign in

Email + password. Two situations trigger a **one-time email code (OTP)**:
1. **First sign-in** for an account (the email-verification gate), or
2. The account has **two-factor enabled**.

```
POST /signin ──► requires2FA? ──no──► logged in (jv_session set)
       │              │ yes
       │              ▼
       │        email contains 6-digit code
       │              │
       └──────────────► POST /verify-login ──► logged in
                        (or POST /send-login-verification to resend)
```

### 4.1 `POST /api/auth/signin`

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | valid email, ≤254 chars |
| `password` | string | 1–200 chars |
| `cfTurnstileToken` | string | optional; Cloudflare Turnstile token (required in prod if Turnstile is configured) |
| `verificationGuid` | string (UUID) | optional; supply with `verificationCode` to submit an OTP inline |
| `verificationCode` | string | optional; 6 digits |
| `rememberMe` | boolean | optional |

```json
{ "email": "ada@example.com", "password": "correct horse battery", "cfTurnstileToken": "0.AbC…" }
```

**Outcome A — no OTP needed → `200 OK`** (sets `jv_session`)
```json
{ "user": { "id": "…", "email": "ada@example.com", "displayName": "Ada Lovelace" } }
```

**Outcome B — OTP required → `200 OK`** (a code was emailed; **no** session yet)
```json
{ "success": true, "requires2FA": true, "email": "ada@example.com", "verificationGuid": "…" }
```
Proceed to `/verify-login` (or resubmit `/signin` with `verificationGuid` + `verificationCode`).

**Errors**
- `401 Invalid email or password` — same generic message for unknown email **and** wrong password (no account enumeration).
- `400 Human verification failed. Please retry.` — Turnstile check failed.
- `423` — account temporarily **locked**; body includes `"locked": true` and `lockedUntil`.

OTP codes expire in **15 minutes**, allow **5** attempts.

---

### 4.2 `POST /api/auth/verify-login` — submit the sign-in OTP

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | valid email |
| `verificationGuid` | string (UUID) | from the `/signin` `requires2FA` response |
| `verificationCode` | string | 6 digits |
| `rememberMe` | boolean | optional |

**Success — `200 OK`** (sets `jv_session`)
```json
{ "user": { "id": "…", "email": "ada@example.com", "displayName": "Ada Lovelace" } }
```

**Errors**
- `400` — invalid/expired/used code, or wrong code with `attemptsRemaining`.
- `429` — too many attempts; request a new code.

---

### 4.3 `POST /api/auth/send-login-verification` — resend the sign-in OTP

**Request body**: `{ "email": "ada@example.com", "verificationGuid": "…" }`

**Success — `200 OK`**
```json
{ "success": true, "verificationGuid": "…", "resendsRemaining": 1 }
```

**Throttling / errors**
- `429` with `cooldownSeconds` — **60 s** cooldown between resends.
- `423` with `lockedUntil` — resend cap hit (**2 resends**); account **locked for 1 hour**.
- `400` — invalid GUID or already verified.

---

## 5. Forgot password

Anti-enumeration: the response is **identical whether or not the email exists**. A single-use reset link is emailed only to active, password-capable accounts.

```
POST /forgot-password ──► email contains link: https://jubilujah.com/reset-password?token=…
                                  │
                                  ▼
                          POST /reset-password
```

### 5.1 `POST /api/auth/forgot-password`

**Request body**: `{ "email": "ada@example.com" }`

**Success — `200 OK`** (always, even for unknown emails)
```json
{ "ok": true, "message": "If an account exists for that email, a reset link has been sent." }
```

The emailed link points at the web app: `https://jubilujah.com/reset-password?token=<rawToken>`.
The token is valid for **60 minutes** (`PASSWORD_RESET_TTL_MIN`).

---

### 5.2 `POST /api/auth/reset-password` — redeem the token & set a new password

Sets the new password, **burns the token and any other outstanding reset tokens**, clears any login lockout, and **revokes all of the user's sessions** (every device must sign in again).

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `token` | string | 20–200 chars; the `token` from the reset URL |
| `password` | string | 8–200 chars (new password) |

```json
{ "token": "S3cr3t-base64url-token…", "password": "a brand new passphrase" }
```

**Success — `200 OK`**
```json
{ "ok": true }
```
> Note: reset does **not** log the user in — no session cookie is set. Send them to sign-in afterward.

**Errors**
- `400 This reset link is invalid or has expired.` — unknown/used/expired token, or inactive account.
- `400` — validation failed (e.g. password too short).

---

## 6. Change password (authenticated)

For a signed-in user who knows their current password. Keeps the **current** session alive and **logs out every other device**.

### `POST /api/auth/change-password`

- **Requires** a valid `jv_session` cookie (else `401`).
- **Requires** the `X-CSRF-Token` header.
- **Note the snake_case field names.**

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `current_password` | string | 1–200 chars |
| `new_password` | string | 8–200 chars |

```json
{ "current_password": "old passphrase", "new_password": "even better passphrase" }
```

**Success — `200 OK`**
```json
{ "ok": true }
```

**Errors**
- `401 Authentication required` — no/invalid session.
- `401 Current password is incorrect.`
- `409 No password is set for this account. Use "forgot password" to create one.` — SSO-only account with no password credential.
- `400` — validation failed.

---

## 7. Delete account (authenticated, irreversible)

Hard-deletes the caller's **own** account and clears the session cookie. This removes the user's own ratings, comments, and nominations, de-links append-only references (audit history, uploads, pipeline assignments), then deletes the user — cascading credentials, roles, sessions, security settings, pending verifications, password resets, and personal playlists.

> ⚠️ **Irreversible.** There is no soft-delete or recovery. Always confirm with the user before calling this.

### `DELETE /api/auth/account`

- **Requires** a valid `jv_session` cookie (else `401`).
- **Requires** the `X-CSRF-Token` header.
- No request body.

**Success — `200 OK`** (clears `jv_session`)
```json
{ "ok": true }
```

**Errors**
- `401 Authentication required` — no/invalid session.

---

## 8. Supporting endpoints

### `GET /api/auth/me` — current user
No CSRF required (GET). Returns the session user or an unauthenticated marker.

**Authenticated — `200 OK`**
```json
{
  "authenticated": true,
  "user": { "id": "…", "email": "ada@example.com", "displayName": "Ada Lovelace" },
  "roles": ["content_editor"]
}
```

**Not signed in — `200 OK`**
```json
{ "authenticated": false }
```

### `POST /api/auth/logout`
Revokes the current session and clears `jv_session`. Returns `{ "ok": true }`. (CSRF required.)

### `POST /api/auth/logout-all`
Requires a session. Revokes **all** of the user's sessions across every device. Returns `{ "ok": true }`. (CSRF required.)

---

## 9. End-to-end examples

### 9.1 Sign up (curl)

```bash
# 0. Prime the CSRF cookie (any GET).
curl -s -c jar.txt https://api.jubilujah.com/api/auth/me > /dev/null
CSRF=$(awk '/jv_csrf/ {print $7}' jar.txt)

# 1. Request the verification code.
curl -s -b jar.txt -c jar.txt \
  -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"correct horse battery"}' \
  https://api.jubilujah.com/api/auth/signup
# → { "requiresVerification": true, "verificationGuid": "GUID", ... }

# 2. Verify the emailed 6-digit code → creates the account and logs in.
curl -s -b jar.txt -c jar.txt \
  -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" \
  -d '{"verificationGuid":"GUID","verificationCode":"048213"}' \
  https://api.jubilujah.com/api/auth/verify-signup
# → 201 { "user": { ... } }  (jv_session cookie now in jar.txt)
```

### 9.2 Sign in (browser `fetch`)

```js
const API = 'https://api.jubilujah.com';

// Read the jv_csrf cookie that the API set on a prior request.
const csrf = document.cookie.split('; ').find(c => c.startsWith('jv_csrf='))?.split('=')[1];

const res = await fetch(`${API}/api/auth/signin`, {
  method: 'POST',
  credentials: 'include',                 // send & receive cookies
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
  body: JSON.stringify({ email, password, cfTurnstileToken }),
});
const data = await res.json();

if (data.requires2FA) {
  // Prompt for the emailed code, then:
  await fetch(`${API}/api/auth/verify-login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
    body: JSON.stringify({ email, verificationGuid: data.verificationGuid, verificationCode }),
  });
}
// On success the jv_session cookie is set; the user is signed in.
```

### 9.3 Forgot → reset password (curl)

```bash
# Request a reset link (always 200).
curl -s -b jar.txt -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" \
  -d '{"email":"ada@example.com"}' \
  https://api.jubilujah.com/api/auth/forgot-password

# User clicks the emailed link: https://jubilujah.com/reset-password?token=TOKEN
# The web page submits the token + new password:
curl -s -b jar.txt -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" \
  -d '{"token":"TOKEN","password":"a brand new passphrase"}' \
  https://api.jubilujah.com/api/auth/reset-password
# → { "ok": true }  (all sessions revoked; sign in again)
```

### 9.4 Change password (curl, authenticated)

```bash
curl -s -b jar.txt -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" \
  -d '{"current_password":"old passphrase","new_password":"even better passphrase"}' \
  https://api.jubilujah.com/api/auth/change-password
# → { "ok": true }  (current session kept; other devices logged out)
```

### 9.5 Delete account (curl, authenticated)

```bash
curl -s -X DELETE -b jar.txt -c jar.txt -H "X-CSRF-Token: $CSRF" \
  https://api.jubilujah.com/api/auth/account
# → { "ok": true }  (irreversible; jv_session cleared)
```

---

## 10. Status codes at a glance

| Code | Meaning in these flows |
|------|------------------------|
| `200` | Success (or anti-enumeration success for forgot-password). |
| `201` | Account created (`verify-signup`). |
| `400` | Validation failed, bad/expired/used code, Turnstile failure. |
| `401` | Not authenticated, wrong password, or wrong current password. |
| `403` | CSRF token missing/invalid, or insufficient role. |
| `409` | Email already registered, or no password set on the account. |
| `423` | Account locked (too many sign-in code requests). |
| `429` | Rate limit, OTP attempt cap, or resend cooldown. |
| `500` | Unexpected server error. |

---

## 11. Server-to-server: `POST /api/auth/admin/set-password`

A **service-only** endpoint for trusted partner services (JubileeInspire's centralized auth) to set an existing Jubilujah account's password directly — used for cross-platform password sync. It is **not** part of the browser surface: it uses a short-lived **JWT bearer token** (obtained from the client-credentials token endpoint — see §11.4), **not** the `jv_session` / `jv_csrf` cookie model, and is mounted ahead of the CSRF guard.

> **Live since 2026-06-16.** **Auth migrated to JWT 2026-06-16** (deployed + verified on `api.jubilujah.com`): the static shared service token was replaced by client-credentials **HS256 JWTs**, and `ADMIN_SERVICE_TOKENS` was removed from the environment. See §11.4.

### 11.1 Request
```
POST /api/auth/admin/set-password
Host: api.jubilujah.com
Content-Type: application/json
Authorization: Bearer <JWT>                 # from POST /api/auth/service/token (see §11.4)
Idempotency-Key: <uuid>                     # optional (see §11.5)
```
```json
{ "email": "ada@example.com", "newPassword": "a brand new passphrase" }
```

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | required; valid email, ≤254 chars; matched case-insensitively |
| `newPassword` | string | required; **plaintext** (over TLS); policy **8–200 chars**. Jubilujah hashes it with its own KDF (scrypt). |

### 11.2 Success — `200 OK`
```json
{ "ok": true }
```
No `jv_session` cookie is set — this is a back-office mutation, not a sign-in.

### 11.3 Errors

| Status | `error` | When |
|--------|---------|------|
| `400` | `error` | malformed JSON / missing field (includes `issues[]`) |
| `401` | `unauthorized` | missing/invalid/expired JWT (bad signature, `iss`, `aud`, or `exp`) |
| `403` | `forbidden` | non-HTTPS, JWT lacks the required `admin.set_password` scope, or caller IP not allow-listed |
| `404` | `not_found` | no active Jubilujah account for that email |
| `409` | `conflict` | account exists but is not password-capable (SSO-only, no local password) |
| `422` | `unprocessable` | password fails policy (length) |
| `429` | `error` | per-client rate limit exceeded |
| `500` | `internal` | unexpected error |

Unlike public `forgot-password`, a real `404` for unknown emails is intentional (authenticated, IP-restrictable partner caller).

### 11.4 Authentication (service-to-service) — client-credentials JWT

Auth is a **two-step OAuth2 client-credentials flow**. There is no static shared bearer token; the caller first exchanges its client credentials for a short-lived signed JWT, then presents that JWT on the admin routes.

**Step 1 — get a token:** `POST /api/auth/service/token`

```
POST /api/auth/service/token
Host: api.jubilujah.com
Content-Type: application/json
```
```json
{ "grant_type": "client_credentials",
  "client_id": "jubileeinspire",
  "client_secret": "<secret>",
  "scope": "admin.set_password admin.provision" }
```
- `grant_type` optional (only `client_credentials` is supported). `scope` optional — when given it must be a **subset** of what the client is granted, and narrows the issued token; omit it to receive all of the client's scopes.
- **Success `200`:** `{ "access_token": "<JWT>", "token_type": "Bearer", "expires_in": 600, "scope": "admin.set_password admin.provision" }`
- **Errors:** `401 invalid_client` (unknown id / wrong secret, constant-time compared), `403 invalid_scope` (requested scope not granted), `503 unavailable` (signing not configured).

**Step 2 — call an admin route** with `Authorization: Bearer <access_token>`.

**Token & verification details:**
- **HS256 JWT**, signed and verified with the single symmetric secret `SERVICE_JWT_SECRET`. Every admin call verifies signature + `iss` (`SERVICE_JWT_ISSUER`) + `aud` (`SERVICE_JWT_AUDIENCE`) + `exp`. Claims: `sub`=client id, `scope` (space-delimited), `jti`, `iat`, `exp` (lifetime `SERVICE_TOKEN_TTL_SEC`, default 600s).
- **Per-route scopes:** `set-password` requires `admin.set_password`; `provision-user` requires `admin.provision`. A client granted `*` passes any scope. Missing scope → `403`.
- **Registered clients** come from `SERVICE_CLIENTS` (`id:secret:scopeA|scopeB`, comma-separated; omit the scope field for `*`). When `SERVICE_JWT_SECRET` is unset everything **fails closed** (issuance → `503`, admin routes → `401`).
- **Rotation:** rotate by changing a client's secret in `SERVICE_CLIENTS` (clients re-fetch a token); or rotate the signing key via `SERVICE_JWT_SECRET` (in-flight tokens become invalid — keep TTL short, default 10 min). No long-lived secret is sent on each request.
- **Optional IP allow-list** via `ADMIN_SERVICE_ALLOW_IPS`. When set, a valid token from a non-listed IP → `403`. Empty = token-only. *(Currently empty in production; enable once JI's egress IP is confirmed and the real client IP is propagated through Cloudflare/nginx.)*
- **TLS enforced** at the edge (nginx 80→443, Cloudflare) and asserted in-app (rejects an explicit non-HTTPS `x-forwarded-proto`).
- **No cookie/CSRF/role path** — unreachable from a normal user session.

### 11.5 Idempotency
Honors an optional `Idempotency-Key`. A replay with the same key within **24h** returns the original result **without re-applying** (backed by `identity.service_idempotency`).

### 11.6 Server-side effects (on success)
1. Sets the password with Jubilujah's KDF (replaces the existing credential).
2. **Revokes all** of the user's Jubilujah sessions.
3. **Clears any login lockout** (`locked_until`).
4. Invalidates outstanding password-reset tokens.
5. Writes an **audit record** (`password.admin_set`). The plaintext password is **never** logged (the `Authorization` header is redacted from logs; the body is not logged) or returned.

It does **not** create the account (unknown email → 404), email the user, or return the password/hash.

### 11.7 Example
```bash
# 1) Exchange client credentials for a short-lived JWT.
JWT=$(curl -s -X POST https://api.jubilujah.com/api/auth/service/token \
  -H "Content-Type: application/json" \
  -d '{"grant_type":"client_credentials","client_id":"jubileeinspire","client_secret":"'"$CLIENT_SECRET"'","scope":"admin.set_password"}' \
  | jq -r .access_token)

# 2) Use it as a Bearer token on the admin route.
curl -s -X POST https://api.jubilujah.com/api/auth/admin/set-password \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"email":"ada@example.com","newPassword":"a brand new passphrase"}'
# → { "ok": true }
```

### 11.8 Open items vs. the requirement
- **Q1 (mTLS):** not implemented — auth is a client-credentials **HS256 JWT** + (optional) IP allow-list. Add mTLS at the nginx layer later if required.
- **Q2 (path):** implemented at `/api/auth/admin/set-password` via a dedicated service router with its own middleware (JWT verify + per-client limiter), mounted before the CSRF guard; tokens are issued at `/api/auth/service/token`.
- **Q3 (policy):** 8–200 chars, matching `reset-password` / `change-password`.
- **Q4 (notify user):** no email is sent (per default).
- **Q5 (plaintext):** plaintext over TLS for v1; a `newPasswordHash` variant can be added if both sides adopt an identical KDF.

---

## 12. Server-to-server: `POST /api/auth/admin/provision-user`

Creates an account **directly** (no signup OTP) for a trusted partner service — used by cross-platform sync when a user exists on JubileeInspire but not on Jubilujah. Same auth model as [§11](#114-authentication-service-to-service--client-credentials-jwt) (client-credentials **JWT**, optional IP allow-list, no cookie/CSRF) — requires the **`admin.provision`** scope. **Create-only:** an existing email returns `409` (a non-error to the caller; the password is *not* changed — use `set-password` for that).

> **Live since 2026-06-16**, verified end-to-end on `api.jubilujah.com`.

### 12.1 Request
```
POST /api/auth/admin/provision-user
Authorization: Bearer <JWT>        # from POST /api/auth/service/token, scope admin.provision
Idempotency-Key: <uuid>            # optional
Content-Type: application/json
```
```json
{
  "email": "ada@example.com",
  "password": "the user's current password",
  "firstName": "Ada", "lastName": "Lovelace",
  "displayName": "Ada Lovelace",
  "role": "user", "emailVerified": true,
  "dateOfBirth": "1990-12-10",
  "sourcePlatform": "jubileeinspire"
}
```

| Field | Type | Required | Mapped to (Jubilujah `identity` schema) |
|-------|------|----------|------------------------------------------|
| `email` | string | ✅ | `users.email` (lowercased, UNIQUE) |
| `password` | string | ✅ | **plaintext**, 8–200 chars → hashed with Jubilujah's scrypt KDF into `credentials.password_hash` |
| `firstName`,`lastName` | string | optional | folded into `users.display_name` when `displayName` is omitted |
| `displayName` | string | optional | `users.display_name` (falls back to `firstName lastName`, then the email local-part) |
| `role` | `user`\|`admin`\|`guest` | optional (default `user`) | `user_roles.role` — **mapped** to Jubilujah RBAC (see below) |
| `emailVerified` | boolean | optional | `true` ⇒ `users.first_signin_completed=true` (skips the first-sign-in OTP gate) |
| `dateOfBirth` | string `YYYY-MM-DD` | optional | **age-gated ≥13** (422 if younger); Jubilujah has no DOB column, so it is validated but not stored |
| `sourcePlatform` | string | optional (default `jubileeinspire`) | encoded into `users.external_subject` as `<sourcePlatform>\|<email>` for provenance |

**Role mapping** (JI enum → Jubilujah RBAC): `user → content_editor` (parity with self-serve signups), `admin → admin`, `guest → viewer`.

**Server-managed (never accepted from the caller):** `id`, `created_at`/`updated_at`, `is_active=true`, `last_login_at`, `locked_until`. Jubilujah's schema has **no** billing/account/Stripe columns, so there is nothing to copy there — a provisioned user starts clean.

### 12.2 Responses

| Status | Body |
|--------|------|
| `201 Created` | `{ "user": { "id", "email", "displayName", "role", "emailVerified" } }` — `role` is the **Jubilujah** RBAC role (mapped) |
| `409 Conflict` | `{ "error": "conflict", "message": "An account with this email already exists." }` — idempotent "already exists"; password unchanged |
| `400` | validation failed (`issues[]`) |
| `422` | password length or age (<13) policy violation |
| `401` / `403` | bad/missing/expired JWT / missing `admin.provision` scope / IP not allow-listed / non-HTTPS |
| `429` | per-client rate limit |
| `500` | unexpected error |

The created record is **active and password-capable** (a normal `signin` works immediately when `emailVerified:true`). No signup OTP email is sent; the password/hash is never returned; an audit row (`account.provisioned`) is written for every call. `Idempotency-Key` gives a 24h replay cache (returns the original result without re-creating).

> JI's client treats **201 = created** and **409 = already exists** — both non-errors.

### 12.3 Example
```bash
# Get a JWT first (see §11.7), with scope admin.provision, then:
curl -s -X POST https://api.jubilujah.com/api/auth/admin/provision-user \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"email":"ada@example.com","password":"correct horse battery",
       "firstName":"Ada","lastName":"Lovelace","role":"user",
       "emailVerified":true,"sourcePlatform":"jubileeinspire"}'
# → 201 { "user": { "id":"…","email":"ada@example.com","displayName":"Ada Lovelace","role":"content_editor","emailVerified":true } }
```

---

*Last verified against `app/api/src/routes/auth.js`, `routes/service.js`, `routes/serviceToken.js`, `middleware/serviceAuth.js`, and `auth/serviceToken.js`. Production routing: `api.jubilujah.com` → nginx → `127.0.0.1:4030` (pm2 `jubilujah-api`).*
