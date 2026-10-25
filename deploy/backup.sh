#!/usr/bin/env bash
# Ночной бэкап базы в /var/backups/sovpalo. Запускается таймером sovpalo-backup.timer.
# Копии лежат на диске сервера и попадают в снимки VPS reg.ru (docs/it/deploy.md, «Бэкап»).
set -euo pipefail
umask 077
cd /srv/sovpalo

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/sovpalo}"
KEEP_DAILY="${KEEP_DAILY:-7}"
KEEP_WEEKLY="${KEEP_WEEKLY:-8}"
KEEP_MONTHLY="${KEEP_MONTHLY:-12}"
stamp="$(date -u +%Y-%m-%dT%H%M%SZ)"

mkdir -p "$BACKUP_ROOT"/{daily,weekly,monthly}
tmp="$(mktemp "$BACKUP_ROOT/.in-progress-XXXXXX")"
trap 'rm -f "$tmp"' EXIT

# Сжатый custom-формат: восстанавливается целиком или по таблицам через pg_restore
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --compress=9' > "$tmp"
# Нечитаемый архив ловим сейчас, а не в день восстановления
docker compose exec -T postgres pg_restore --list < "$tmp" > /dev/null

target="$BACKUP_ROOT/daily/sovpalo-$stamp.dump"
mv "$tmp" "$target"
trap - EXIT

# Еженедельные и ежемесячные — жёсткие ссылки, лишнего места не занимают
if [ "$(date -u +%u)" = 7 ]; then ln "$target" "$BACKUP_ROOT/weekly/"; fi
if [ "$(date -u +%d)" = 01 ]; then ln "$target" "$BACKUP_ROOT/monthly/"; fi

prune() { find "$1" -name '*.dump' | sort -r | tail -n +"$(($2 + 1))" | xargs -r rm -f; }
prune "$BACKUP_ROOT/daily" "$KEEP_DAILY"
prune "$BACKUP_ROOT/weekly" "$KEEP_WEEKLY"
prune "$BACKUP_ROOT/monthly" "$KEEP_MONTHLY"

echo "Бэкап: $target ($(du -h "$target" | cut -f1))"
