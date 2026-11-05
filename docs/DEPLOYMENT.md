# Deployment guide

This guide shows how to self-host Ankese on a Linux server. Replace `example.com` with your domain.
The files under `deploy/` are working examples from a production setup; adapt paths and domains before using them.

## Requirements

- Linux (Debian/Ubuntu), Node.js 22+, MySQL 8, nginx, certbot
- A domain with two hostnames: the site (`example.com`) and the admin panel (`panel.example.com`)
- Optional: a [Resend](https://resend.com) account for email, Cloudflare in front of nginx

## 1. System user and code

```bash
useradd --system --no-create-home --shell /usr/sbin/nologin --user-group ankese
git clone <repo-url> /var/www/ankese && cd /var/www/ankese
npm ci --omit=dev
```

## 2. Database

Create the database and **two** users: one for the application (data only, no `DROP`) and one for migrations.

```sql
CREATE DATABASE ankese CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'ankese_app'@'localhost' IDENTIFIED BY '<strong password>';
CREATE USER 'ankese_migrate'@'localhost' IDENTIFIED BY '<strong password>';
GRANT SELECT, INSERT, UPDATE, DELETE ON ankese.* TO 'ankese_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON ankese.* TO 'ankese_migrate'@'localhost';
```

Keep MySQL bound to `127.0.0.1` and closed in the firewall.

## 3. Configuration

```bash
cp .env.example .env && chmod 640 .env && chown root:ankese .env
```

Fill in `SITE_ORIGIN`, `PANEL_ORIGIN`, the `DB_*` values (application user), a random `SESSION_SECRET` of at least 32
characters (`openssl rand -base64 48`) and, if you send email, `RESEND_API_KEY`. In production the app refuses to start
with a missing or weak secret. Put the migration user's `DB_*` values in a separate root-only file, for example
`/root/ankese-migrate.env`, and keep it out of the repository.

## 4. Migrate and create the first admin

```bash
set -a; . /root/ankese-migrate.env; set +a
node server/scripts/migrate.js
ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" node server/scripts/create-admin.js   # password is prompted
```

On first login the panel asks the admin to set up TOTP (any authenticator app, manual key entry).
If a device is lost: `ADMIN_EMAIL=you@example.com node server/scripts/reset-totp.js`.

## 5. Application service

Copy `deploy/systemd/ankese.service` to `/etc/systemd/system/`, adjust paths if needed, then:

```bash
systemctl daemon-reload && systemctl enable --now ankese
curl -s http://127.0.0.1:3200/healthz   # {"ok":true}
```

The unit runs as the `ankese` user with a sandbox (`ProtectSystem=strict`, `NoNewPrivileges`, a memory limit).

## 6. nginx and TLS

Use `deploy/nginx/` as a starting point (`ankese.conf`, `ankese-limits.conf`, and the two snippets). Replace the domain,
put the snippets in `/etc/nginx/snippets/`, the limits file in `/etc/nginx/conf.d/`, and enable the site.
Issue one certificate that covers both hostnames, for example with the webroot method:

```bash
certbot certonly --webroot -w /var/www/certbot -d example.com -d www.example.com -d panel.example.com
```

The example config serves `public/` statically, proxies dynamic routes to `127.0.0.1:3200`, redirects `www` and HTTP,
and applies per-IP rate limits. If you run behind Cloudflare the limits use the `CF-Connecting-IP` header; in that case
allow only Cloudflare's IP ranges on port 443 so the header cannot be forged.

## 7. Email

Create an API key with sending access only, restricted to your domain. Add the DNS records Resend shows for your domain
(DKIM TXT, plus MX and SPF TXT on the `send` subdomain) and verify them. Set `RESEND_API_KEY`. Without it, or with
`MAIL_MODE=log`, emails are printed to the log instead (and the sign-in links are hidden on the public site).

## 8. Backups

`deploy/ankese-backup.sh` makes an encrypted daily dump of the database and configuration with a 14-day rotation and
verifies every backup by decrypting it. It creates its key at `/root/.ankese-backup.key` the first time: **copy that key
to a safe place off the server**, backups are useless without it. Also copy the backups themselves off the server.

## 9. Updating

```bash
git pull && ./deploy.sh      # installs deps, audits, applies migrations, restarts, runs the health check
```

## Before you launch

- Replace the legal pages in `server/lib/legal_text.js` (terms, privacy, rules, cookies). The shipped texts are drafts
  written for one specific operator and **must be reviewed by a lawyer** for your jurisdiction.
- Review the starter blocklist with native speakers (`docs/MODERATION.md`).
- Update the operator name and contact address, brand and favicon, and `public/robots.txt`.
- Turn on HTTPS-only and a bot-protection layer at your CDN, and consider limiting the panel host to known IPs.
- Add your first companies from the panel; an empty directory is not useful to visitors.
