# Contributing

Thanks for helping. Issues and pull requests are welcome.

## Local setup

You need Node.js 22+ and MySQL 8.

```bash
git clone <repo-url> && cd ankese
npm ci
cp .env.example .env        # set NODE_ENV=development, DB_*, SESSION_SECRET (any 32+ chars), MAIL_MODE=log
# create a local database and a user, then:
set -a; . ./migrate.env; set +a   # DB_* of a user that can create tables
node server/scripts/migrate.js
ADMIN_EMAIL=dev@example.com ADMIN_NAME=Dev node server/scripts/create-admin.js
npm run dev          # node --env-file=.env server/index.js
```

For local work use `SITE_ORIGIN=http://localhost:3200` and `PANEL_ORIGIN=http://panel.localhost:3200`
(browsers resolve `*.localhost` to your machine). Outside production the app allows plain HTTP and omits HSTS and
`upgrade-insecure-requests`. With `MAIL_MODE=log` emails (verification links etc.) are printed to the console
instead of being sent.

## Tests

```bash
npm test
```

Tests use Node's built-in runner and need no database. Please add or update tests for behaviour you change,
especially for `server/lib/screen.js` (moderation), `totp.js` and `password.js`.

## Code guidelines

- **Dependencies:** keep them minimal (currently `express` and `mysql2`). Prefer the Node standard library.
- **SQL:** always parameterised (`?`). Never concatenate user input. Whitelist `ORDER BY` columns.
- **Output:** escape everything with `esc()`. No `innerHTML`, no inline `<script>`/`<style>`/event handlers
  (the CSP forbids them).
- **Forms:** every state-changing request is a POST protected by CSRF (`session.checkPost`).
- **Strings:** add every user-facing string to both languages (`sq` and `en`); `npm test` checks they match.
- **Migrations:** add a new numbered file in `migrations/`, never edit one that has been applied.
- **Secrets:** never commit `.env` files, keys or real data.
- Style: CommonJS, 2-space indentation, `'use strict'`, small focused functions.

## Pull requests

1. Open an issue first for larger changes.
2. Keep a PR focused on one thing and describe what and why.
3. Make sure `npm test` passes and you tested the change manually.

## Security

Please report vulnerabilities privately (see `SECURITY.md`), not in public issues.
