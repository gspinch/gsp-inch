#!/bin/sh
# Ежедневный бэкап базы и фото. Добавить в cron: 0 4 * * * /root/gsp-inch/backup.sh
cd "$(dirname "$0")"
mkdir -p backups
tar czf "backups/data-$(date +%F).tar.gz" data
ls -1t backups/*.tar.gz | tail -n +15 | xargs -r rm
