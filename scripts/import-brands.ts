/**
 * pnpm import:brands <файл.json> [--dry-run] [--keep-missing]
 *
 *   --dry-run       проверить файл и показать, что изменится, ничего не записывая
 *   --keep-missing  не скрывать бренды, которых нет в файле (по умолчанию они уходят в hold)
 */
import "./load-env";
import { parseArgs } from "node:util";
import { closeDb, db } from "@/db";
import { importBrands } from "@/import/import-brands";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { "dry-run": { type: "boolean", default: false }, "keep-missing": { type: "boolean", default: false } },
});

const file = positionals[0];
if (!file) {
  console.error("Укажите файл: pnpm import:brands data/brands.json [--dry-run] [--keep-missing]");
  process.exit(2);
}

const list = (ids: string[]) => (ids.length ? ` — ${ids.join(", ")}` : "");

try {
  const result = await importBrands(db, file, { dryRun: values["dry-run"], keepMissing: values["keep-missing"] });
  if (!result.ok) {
    console.error(`Файл не прошёл проверку, в базу ничего не записано. Ошибок: ${result.errors.length}`);
    for (const e of result.errors) console.error(`  ${e.brand ?? "файл"} · ${e.field}: ${e.message}`);
    process.exitCode = 1;
  } else {
    const r = result.report;
    const changed = r.added.length + r.updated.length + r.hidden.length > 0;
    const head = r.dryRun ? "Пробный запуск, ничего не записано" : changed ? "Импорт применён" : "Изменений нет";
    console.log(`${head}: ${r.file}, брендов в файле ${r.total}`);
    console.log(`  добавлено: ${r.added.length}${list(r.added)}`);
    console.log(`  обновлено: ${r.updated.length}${list(r.updated)}`);
    console.log(`  без изменений: ${r.unchanged.length}`);
    console.log(`  скрыто (hold), нет в файле: ${r.hidden.length}${list(r.hidden)}`);
  }
} finally {
  await closeDb();
}
