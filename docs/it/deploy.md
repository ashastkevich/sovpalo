# Сервер и выкатка

Решение и причины — в ADR-0001, раздел 8. Здесь — как это устроено и что делать руками.

## Сервер

- VPS на reg.ru: Ubuntu 26.04, 2 vCPU, 2 ГБ памяти, swap 2 ГБ, диск 38 ГБ.
- Адрес `89.108.70.209`. Вход только по SSH-ключу, пароль отключён.
- Фаервол ufw: открыты 22, 80 и 443. Наружу публикуется только nginx, база снаружи недоступна.
- Пользователи: `root` — для администрирования, `deploy` — для выкатки из GitHub Actions (в группе `docker`).
- Стек лежит в `/srv/sovpalo`:

| Файл | Откуда |
|---|---|
| `compose.yml`, `deploy.sh` | Из `deploy/` в репозитории, обновляются при каждой выкатке |
| `nginx/proxy.inc`, `nginx/https.conf.example` | Так же |
| `nginx/default.conf` | Живёт на сервере: сначала HTTP, после выпуска сертификата — HTTPS |
| `.env` | Только на сервере: пароль базы, `SITE_URL`, `SITE_INDEXING`, `SITE_STAGE` |
| `data/` | Файлы брендов для импорта |
| `.image-tag` | Какой образ сейчас выкачен |

Контейнеры: `postgres` (PostgreSQL 18), `app` (Next.js), `nginx`. Разовые: `tools` (миграции, импорт), `certbot`.

## Как идёт выкатка

Push в `main` запускает `.github/workflows/ci.yml`:

1. `check` — линтер, типы, тесты, проверка `brands.sample.json`. Он же идёт на каждый PR.
2. `build` — собирает два образа и кладёт в GitHub Container Registry с тегом коммита и `latest`:
   `ghcr.io/ashastkevich/sovpalo` (сайт, Next.js standalone) и `ghcr.io/ashastkevich/sovpalo-tools` (миграции и импорт).
3. `deploy` — по SSH копирует файлы стека и запускает `deploy.sh <коммит>`: скачать образы, применить миграции, перезапустить `app`.

Если сборка или проверки упали, сервер не трогается. Выкатку можно запустить и вручную: Actions → CI/CD → Run workflow.

Секреты в GitHub (Settings → Secrets and variables → Actions): `DEPLOY_HOST`, `DEPLOY_SSH_KEY` (ключ пользователя `deploy`), `DEPLOY_KNOWN_HOSTS`. Переменная `SITE_URL` попадает в сборку.

## Частые действия

Все команды — на сервере, из `/srv/sovpalo`.

Откатить на прошлую версию (теги — хеши коммитов):

```bash
./deploy.sh <хеш коммита>
```

Импорт брендов: положить файл в `data/` и запустить

```bash
docker compose run --rm tools pnpm import:brands data/brands.json --dry-run
docker compose run --rm tools pnpm import:brands data/brands.json
```

Логи и состояние:

```bash
docker compose ps
docker compose logs -f --tail=100 app
```

## HTTPS

Пока домен `sovpalo.net` не смотрит на сервер (сейчас A-запись — парковка reg.ru, 31.31.198.113), сайт отдаётся по HTTP на IP сервера. После переключения A-записей `sovpalo.net` и `www.sovpalo.net` на `89.108.70.209`:

```bash
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d sovpalo.net -d www.sovpalo.net --email <почта> --agree-tos -n
cp nginx/https.conf.example nginx/default.conf
docker compose exec nginx nginx -s reload
```

Продление — `docker compose run --rm certbot renew` и перезагрузка nginx по расписанию; настраивается вместе с выпуском сертификата.

## Бэкап

По ADR — ежедневный `pg_dump` в S3-совместимое хранилище вне сервера. Ещё не настроен: нужно выбрать и создать хранилище.
