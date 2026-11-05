# Ankese

An open-source consumer complaint platform for **Albania and Kosovo** (live at [ankese.com](https://ankese.com)).
Users publish complaints about companies, moderators review them, and companies can reply publicly.
Albanian (default) and English interface.

## Features

- Accounts with email verification, password reset, brute-force protection
- Complaint flow: company search, "suggest a missing company", moderation queue before publishing
- Automatic pre-screening of every complaint: profanity (with obfuscation handling), threats, hate speech,
  personal data (phones, emails, IBAN, IDs), defamation risk, spam and context signals — produces a risk score
  and highlights; **a human moderator always decides**
- Admin panel on a separate host: password + TOTP 2FA, risk-sorted queues, auto-mask preview, company management,
  editable blocklist with a test box, user management, takedown/contact requests, audit log
- Public pages: companies, categories, cities, complaint pages, search, dynamic sitemap with `hreflang`
- Strict security headers (CSP without inline scripts/styles), CSRF protection, per-IP rate limiting

## Stack

Node.js 22 · Express · MySQL 8 · server-rendered HTML (no frontend framework, no build step) · nginx in front.
Only two runtime dependencies (`express`, `mysql2`); session, CSRF, rate limit, scrypt hashing, TOTP and mail are
implemented with the Node standard library.

## Getting started

```bash
git clone <this repo> && cd ankese
npm ci --omit=dev
cp .env.example .env                  # fill in the values
# create the database and two MySQL users (app: DML only, migrate: DDL), then:
set -a; . ./migrate.env; set +a       # DB_* for the migrate user
node server/scripts/migrate.js
node server/scripts/create-admin.js   # ADMIN_EMAIL / ADMIN_NAME, password prompted
npm run dev    # local; in production run it as a service, see docs/DEPLOYMENT.md
```

Put nginx in front (see `deploy/nginx/` for a working example) and serve `public/` statically. The admin panel
is served from the host in `PANEL_ORIGIN`; a staff account must complete TOTP setup at first login.
In development set `MAIL_MODE=log` to print emails to the console.

## Documentation

- [Deployment guide](docs/DEPLOYMENT.md): self-hosting step by step
- [Architecture](docs/ARCHITECTURE.md): request flow, sessions, data model
- [Moderation pipeline](docs/MODERATION.md): how complaints are screened
- [Contributing](CONTRIBUTING.md), [Security policy](SECURITY.md), [Code of conduct](CODE_OF_CONDUCT.md), [Changelog](CHANGELOG.md)

Run the tests with `npm test`.

## Layout

```
server/        Express app (routes, lib, panel, scripts)
public/        static assets and fallback pages (served by nginx)
migrations/    SQL migrations (applied in order by server/scripts/migrate.js)
tests/         unit tests (node --test, no database needed)
docs/          architecture, deployment and moderation docs
deploy/        example nginx / systemd / backup configuration
```

## Moderation notes

The starter blocklist in `migrations/0005_moderation.sql` is **only a starting point** and should be reviewed by
native speakers; it can be edited at runtime from the admin panel.

## License

Ankese is free software, released under the **GNU Affero General Public License v3.0** (see [LICENSE](LICENSE)).
If you run a modified version as a network service you must offer its source code to the users of that service.

## Contributing

Issues and pull requests are welcome. Please keep dependencies minimal, escape all output, use parameterized SQL
and avoid inline scripts/styles (the CSP forbids them). Report vulnerabilities privately (see `SECURITY.md`).
