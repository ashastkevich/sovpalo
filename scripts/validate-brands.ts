/** pnpm validate:brands <файл.json> — только проверка по схеме, без базы. Запускается в CI на data/brands.sample.json */
import { readFileSync } from "node:fs";
import { validateBrandsFile } from "@/import/import-brands";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Укажите файл: pnpm validate:brands data/brands.sample.json");
  process.exit(2);
}
for (const file of files) {
  const v = validateBrandsFile(JSON.parse(readFileSync(file, "utf8")));
  if (v.ok) console.log(`${file}: ок, брендов ${v.records.length}`);
  else {
    console.error(`${file}: ошибок ${v.errors.length}`);
    for (const e of v.errors) console.error(`  ${e.brand ?? "файл"} · ${e.field}: ${e.message}`);
    process.exitCode = 1;
  }
}
