/**
 * Счётчик переходов в магазины (ADR-0001, раздел 5; FR-28): только суммы по дням, без IP, cookie и User-Agent.
 * По нему считается гарантия 250 переходов и метрика К4.
 */
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { clickDaily } from "@/db/schema";
import type { ShopKind } from "@/lib/taxonomy";

/** День по Москве: отчёты брендам и гарантия считаются по московским суткам */
function moscowDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(now);
}

export async function countClick(input: { brandId: string; shop: ShopKind; source: string; campaign: string }) {
  await db
    .insert(clickDaily)
    .values({ ...input, day: moscowDay(), count: 1 })
    .onConflictDoUpdate({
      target: [clickDaily.brandId, clickDaily.shop, clickDaily.day, clickDaily.source, clickDaily.campaign],
      set: { count: sql`${clickDaily.count} + 1` },
    });
}
