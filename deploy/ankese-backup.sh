#!/usr/bin/env bash
# Ankese gunluk sifreli yedek. Cikti: /var/backups/ankese/ankese-YYYYmmdd-HHMMSS.tar.gz.enc
# Geri yukleme:
#   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:/root/.ankese-backup.key -in DOSYA.enc | tar xz -C /tmp/restore
#   mysql ankese < /tmp/restore/db.sql      (once bos bir veritabani olusturun)
set -euo pipefail
umask 077
DIR=/var/backups/ankese; KEY=/root/.ankese-backup.key; KEEP_DAYS=14
mkdir -p "$DIR"; chmod 700 "$DIR"
[ -s "$KEY" ] || { openssl rand -base64 48 > "$KEY"; chmod 600 "$KEY"; logger -t ankese-backup "yeni anahtar uretildi: $KEY (baska yere de kaydedin!)"; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
mysqldump --single-transaction --routines --no-tablespaces --default-character-set=utf8mb4 ankese > "$TMP/db.sql"
mkdir -p "$TMP/files"
for f in /var/www/ankese/.env /root/ankese-migrate.env /etc/nginx/sites-available/ankese /etc/nginx/conf.d/ankese-limits.conf \
         /etc/nginx/snippets/ankese-proxy.conf /etc/nginx/snippets/ankese-sec-headers.conf /etc/systemd/system/ankese.service /usr/local/sbin/ankese-backup.sh; do
  [ -f "$f" ] && install -D -m 600 "$f" "$TMP/files$f"
done
OUT="$DIR/ankese-$(date -u +%Y%m%d-%H%M%S).tar.gz.enc"
tar czf - -C "$TMP" db.sql files | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass file:"$KEY" -out "$OUT"
chmod 600 "$OUT"
# dogrulama: sifre cozulebiliyor ve arsiv okunabiliyor mu, SQL icinde beklenen tablo var mi
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:"$KEY" -in "$OUT" | tar xzO db.sql 2>/dev/null | grep -q "CREATE TABLE \`complaints\`" \
  || { logger -t ankese-backup "DOGRULAMA BASARISIZ: $OUT"; rm -f "$OUT"; exit 1; }
find "$DIR" -name 'ankese-*.tar.gz.enc' -mtime +"$KEEP_DAYS" -delete
logger -t ankese-backup "tamam: $OUT ($(du -h "$OUT" | cut -f1))"
echo "$OUT"
