# Образы собираются в GitHub Actions, на сервере сборки нет (ADR-0001, раздел 8).
#   app   — сайт: Next.js standalone, без исходников и dev-зависимостей
#   tools — консольные команды на сервере: миграции и импорт брендов
FROM node:24-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack install && pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
# SITE_URL попадает в metadataBase при сборке, остальные переменные читаются при запросе
ARG SITE_URL=https://sovpalo.net
# Сборке база не нужна, но env() проверяет формат адреса
RUN SITE_URL=$SITE_URL DATABASE_URL=postgres://build:build@localhost:5432/build pnpm build

FROM node:24-slim AS app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

FROM deps AS tools
COPY . .
# Запускается разово и только во внутренней сети стека; pnpm и corepack живут в домашней папке root
CMD ["pnpm", "db:migrate"]
