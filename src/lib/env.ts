import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  /** Публичный адрес сайта без слеша в конце: canonical, sitemap, Open Graph, проверка Referer в /go/ */
  SITE_URL: z.string().url().default("http://localhost:3000"),
  /** До открытия каталога false: noindex на всех страницах и robots.txt всё запрещает (NFR-7) */
  SITE_INDEXING: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  /** preview — полоса «Предпросмотр каталога» и блок «Это ваш бренд?» (FR-9, FR-16) */
  SITE_STAGE: z.enum(["preview", "open"]).default("preview"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Переменные окружения читаются при запросе, а не при сборке: один образ для staging и prod */
export function env(): Env {
  if (!cached) cached = schema.parse(process.env);
  return cached;
}

export function siteUrl(path = "/"): string {
  return new URL(path, env().SITE_URL).toString();
}
