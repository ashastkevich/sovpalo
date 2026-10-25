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
| `compose.yml`, `deploy.sh`, `backup.sh` | Из `deploy/` в репозитории, обновляются при каждой выкатке |
| `nginx/proxy.inc`, `nginx/https.conf.example` | Так же |
| `nginx/default.conf` | Живёт на сервере, копия `https.conf.example`. До сертификата был HTTP-вариант из `deploy/nginx/default.conf` |
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

Сертификат Let's Encrypt на `sovpalo.net` и `www.sovpalo.net` выпущен 25.10.2026, без почты для уведомлений. `nginx/default.conf` на сервере — копия `https.conf.example`: http и `www` перенаправляются на `https://sovpalo.net`.

Продление: systemd-таймер `sovpalo-certbot.timer` дважды в сутки запускает `docker compose run --rm certbot renew` и перезагружает nginx. Проверить:

```bash
systemctl list-timers sovpalo-certbot.timer
journalctl -u sovpalo-certbot.service -n 20
```

Выпуск заново (новый сервер или новый домен):

```bash
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d sovpalo.net -d www.sovpalo.net --register-unsafely-without-email --agree-tos -n
cp nginx/https.conf.example nginx/default.conf
docker compose exec nginx nginx -s reload
```

## Бэкап

Каждую ночь в 03:30 по Москве таймер `sovpalo-backup.timer` запускает `backup.sh`: `pg_dump` из контейнера в `/var/backups/sovpalo`, проверка архива через `pg_restore --list`, ротация — 7 ежедневных, 8 еженедельных (воскресенье) и 12 ежемесячных (1-е число) копий. Дамп с 64 брендами весит около 80 КБ.

Копии лежат на диске сервера, поэтому снимки VPS reg.ru каждый раз содержат и согласованный дамп. Снимок возвращает весь сервер, дамп — базу или отдельную таблицу. От потери аккаунта или проблем у reg.ru это не спасает: внешнее хранилище (S3 у другого провайдера, например Yandex Object Storage) добавим, когда в базе появятся данные, которые жалко потерять, — переходы, анкеты брендов.

Проверить и восстановить:

```bash
journalctl -u sovpalo-backup.service -n 5
ls -lh /var/backups/sovpalo/daily
# В отдельную базу, чтобы посмотреть или достать таблицу
docker compose exec -T postgres sh -c 'createdb -U $POSTGRES_USER restore_test && pg_restore -U $POSTGRES_USER -d restore_test --no-owner' < /var/backups/sovpalo/daily/<файл>.dump
# Целиком поверх рабочей базы (сайт на это время лучше остановить: docker compose stop app)
docker compose exec -T postgres sh -c 'pg_restore -U $POSTGRES_USER -d $POSTGRES_DB --clean --if-exists --no-owner' < /var/backups/sovpalo/daily/<файл>.dump
```
