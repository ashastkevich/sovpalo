# Sovpalo

Сайт каталога «Совпало»: Next.js, PostgreSQL 18, Drizzle (решение — [ADR-0001](docs/it/architecture/adr/0001-tech-stack-and-architecture.md)).

```bash
corepack pnpm install
cp .env.example .env.local
corepack pnpm db:up && corepack pnpm db:migrate
corepack pnpm import:brands data/brands.sample.json
corepack pnpm dev
```

Как устроен код, команды и импорт брендов — [docs/it/development.md](docs/it/development.md). Вся документация проекта — в папке [`docs/`](docs/README.md).
