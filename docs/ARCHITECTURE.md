# Architecture

## Overview

```
Browser ──► (Cloudflare) ──► nginx ──┬─► static files (public/)            fast path
                                      └─► Express on 127.0.0.1:PORT ──► MySQL
```

nginx serves `public/assets` directly and proxies dynamic routes (home, catalog, auth, write flow, legal pages,
sitemap, the admin panel) to Express. Two hostnames hit the same Express process:

| Host (`.env`) | Purpose |
|---|---|
| `SITE_ORIGIN` | public site |
| `PANEL_ORIGIN` | admin panel (separate cookies, separate sessions, staff only) |

Any other `Host` header gets a 404 (`server/security.js`).

## Request pipeline (`server/index.js`)

1. `hostGuard`: reject unknown hosts. Sets `req.isPanel`.
2. `securityHeaders`: CSP (no inline script/style), HSTS, `nosniff`, frame/COOP/CORP/permissions policies.
3. Body parsers with small limits (16 KB JSON, 4 KB urlencoded).
4. `/healthz`.
5. `session.load`: CSRF cookie + session lookup (scope `site` or `panel`).
6. Panel router when `isPanel`, otherwise the site routers.
7. 404 and a generic error handler (never leaks stack traces, paths or SQL).

## Sessions, CSRF, rate limiting

- Session token: 32 random bytes in a `__Host-` cookie (`HttpOnly; Secure; SameSite=Strict`). Only its SHA-256 is stored.
- `sessions.scope` separates site and panel sessions. Panel sessions are 8 h and require a staff role.
- CSRF: a random cookie plus an HMAC of it in every form, **and** an Origin/Referer check on every POST.
- Rate limiting: in-memory counters in `server/lib/ratelimit.js` (per IP) plus nginx `limit_req` zones.
- IPs are never stored in plain text, only `HMAC(SESSION_SECRET, ip)`.
- Passwords: scrypt (N=2^15), concurrency-limited. Staff must also pass TOTP (`server/lib/totp.js`), secrets are
  encrypted at rest with AES-256-GCM.

## Rendering

Server-rendered HTML built from template strings. Every value goes through `esc()` (`server/lib/html.js`). There is
no client-side framework and no inline script/style, so the CSP can stay strict. Strings live in
`server/lib/i18n.js` and `i18n_catalog.js`, URLs in `server/lib/paths.js`; Albanian (`sq`) and English (`en`) must
always have the same keys (`tests/i18n.test.js` enforces it).

## Data model (MySQL, utf8mb4, see `migrations/`)

`countries`, `cities`, `categories`, `companies`, `company_aliases`, `company_suggestions`, `users`, `sessions`,
`email_tokens`, `complaints`, `complaint_edits`, `moderation_log`, `audit_log`, `blocklist`, `legal_requests`,
`schema_migrations`.

Complaint lifecycle: `awaiting_company` (company suggested, not yet approved) → `pending` (waiting for a moderator)
→ `published` → `resolved`; or `rejected` / `removed`. Nothing is published automatically.

## Migrations

`server/scripts/migrate.js` applies `migrations/*.sql` in filename order and records them in `schema_migrations`.
It should run with a MySQL user that has DDL rights; the application itself uses a user with data rights only
(no `DROP`). Never edit a migration that has been applied, add a new one.

## Admin panel (`server/panel/`)

Login (password then TOTP), risk-sorted complaint queue, company suggestions, company management, blocklist editor,
user management, contact/takedown requests and logs. Moderators can use complaints, suggestions, companies and
requests; admins additionally manage the blocklist, users and logs.
