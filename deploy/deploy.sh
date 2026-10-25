#!/usr/bin/env bash
# Выкатка новой версии на сервере. Запускается из GitHub Actions по SSH:
#   deploy.sh <тег образа>
# Без аргумента повторно выкатывает текущий тег, с прошлым тегом — откатывает.
set -euo pipefail
cd /srv/sovpalo

tag="${1:-$(cat .image-tag 2>/dev/null || echo latest)}"
export IMAGE_TAG="$tag"

docker compose pull --quiet app tools
docker compose up -d --wait postgres
# Миграции до запуска нового контейнера (ADR-0001, раздел 8)
docker compose run --rm tools pnpm db:migrate
docker compose up -d --wait --remove-orphans app nginx
docker compose exec nginx nginx -s reload

echo "$tag" > .image-tag
docker image prune -f --filter "until=168h" >/dev/null
echo "Выкачен образ $tag"
