# Sunucu yapilandirmasi (kayit amacli kopyalar)

Canli dosyalarin kopyalaridir; sir icermez. Canli yerleri:

| Dosya | Canli yer |
|---|---|
| nginx/ankese.conf | /etc/nginx/sites-available/ankese (sites-enabled'a bagli) |
| nginx/ankese-limits.conf | /etc/nginx/conf.d/ankese-limits.conf |
| nginx/ankese-proxy.conf, ankese-sec-headers.conf | /etc/nginx/snippets/ |
| systemd/ankese.service | /etc/systemd/system/ankese.service |
| ankese-backup.sh | /usr/local/sbin/ankese-backup.sh (cron: /etc/cron.d/ankese-backup, her gun 03:15) |

Gizli degerler: `/var/www/ankese/.env`, `/root/ankese-migrate.env`, `/root/.ankese-backup.key` (git'e girmez).
Deploy: `/var/www/ankese/deploy.sh`.
