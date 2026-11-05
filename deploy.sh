#!/usr/bin/env bash
# Kullanim (root): /var/www/ankese/deploy.sh
set -euo pipefail
cd /var/www/ankese
echo "== bagimliliklar"
npm ci --omit=dev --ignore-scripts
npm audit --omit=dev
echo "== izinler"
chown -R root:ankese server node_modules package.json package-lock.json migrations
chmod -R g+rX,o-rwx server node_modules package.json package-lock.json migrations
echo "== migration"
( set -a; . /root/ankese-migrate.env; set +a; node server/scripts/migrate.js )
echo "== yeniden baslat"
systemctl restart ankese
sleep 2
systemctl is-active ankese
curl -fsS -H "Host: ankese.com" http://127.0.0.1:3200/healthz; echo
echo "== tamam"
