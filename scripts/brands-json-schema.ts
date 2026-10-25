/** pnpm schema:brands — пишет schemas/brands.schema.json из схемы Zod, чтобы проверять файл в редакторе */
import { writeFileSync } from "node:fs";
import { z } from "zod";
import { brandsFileSchema } from "@/import/schema";

const schema = z.toJSONSchema(brandsFileSchema, { io: "input", unrepresentable: "any" });
writeFileSync("schemas/brands.schema.json", JSON.stringify({ ...schema, title: "Совпало: файл импорта брендов" }, null, 2) + "\n");
console.log("schemas/brands.schema.json обновлён");
