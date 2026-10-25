import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

function connect() {
  const client = postgres(env().DATABASE_URL, { max: 10, onnotice: () => {} });
  return { client, db: drizzle(client, { schema, casing: "snake_case" }) };
}

/** Одно подключение на процесс; в dev переживает перезагрузку модулей */
const globalForDb = globalThis as unknown as { sovpaloDb?: ReturnType<typeof connect> };

function instance() {
  globalForDb.sovpaloDb ??= connect();
  return globalForDb.sovpaloDb;
}

export type Db = ReturnType<typeof connect>["db"];
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Подключение создаётся при первом запросе, а не при импорте: сборка и тесты обходятся без DATABASE_URL */
export const db = new Proxy({} as Db, {
  get(_, prop) {
    const real = instance().db;
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export async function closeDb() {
  await globalForDb.sovpaloDb?.client.end();
  globalForDb.sovpaloDb = undefined;
}
