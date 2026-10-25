/** Для консольных команд: подхватывает .env.local и .env, как это делает Next.js */
import { existsSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}
