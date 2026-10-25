/**
 * Запись брендов. Через эти функции работает импорт из JSON, позже — админка (ADR-0001, разделы 2–4).
 * Все функции принимают транзакцию: вызывающий код решает, где её границы.
 */
import { type SQL, and, eq, inArray, notInArray, sql } from "drizzle-orm";
import type { Tx } from "@/db";
import * as s from "@/db/schema";
import { FIT_KIND_BY_CUT, STYLE_META, THEME_META, slugify } from "@/lib/taxonomy";
import type { BrandRecord, BrandStatus } from "./types";

type DictTable = typeof s.themes;
type LinkTable = typeof s.brandThemes;

const DICTS = {
  themes: { table: s.themes, link: s.brandThemes, meta: THEME_META },
  styles: { table: s.styles, link: s.brandStyles, meta: STYLE_META },
  decors: { table: s.decors, link: s.brandDecors, meta: {} },
  printTechniques: { table: s.printTechniques, link: s.brandPrintTechniques, meta: {} },
  values: { table: s.brandValues, link: s.brandValueLinks, meta: {} },
} satisfies Record<string, { table: DictTable; link: LinkTable; meta: Record<string, { short?: string; color?: string }> }>;

/** Находит значения справочника по названию и создаёт недостающие (ADR-0001, раздел 3, п. 3) */
async function ensureDictValues(
  tx: Tx,
  table: DictTable,
  names: string[],
  meta: Record<string, { short?: string; color?: string }>,
): Promise<Map<string, number>> {
  const ids = new Map<string, number>();
  if (!names.length) return ids;
  const unique = [...new Set(names)];
  const existing = await tx.select({ id: table.id, name: table.name }).from(table).where(inArray(table.name, unique));
  existing.forEach((r) => ids.set(r.name, r.id));
  const missing = unique.filter((n) => !ids.has(n));
  if (missing.length) {
    const [{ max }] = await tx.select({ max: sql<number>`coalesce(max(${table.position}), 0)` }).from(table);
    const created = await tx
      .insert(table)
      .values(
        missing.map((name, i) => ({
          name,
          slug: slugify(meta[name]?.short ?? name),
          shortName: meta[name]?.short ?? null,
          color: meta[name]?.color ?? null,
          position: Number(max) + i + 1,
        })),
      )
      .returning({ id: table.id, name: table.name });
    created.forEach((r) => ids.set(r.name, r.id));
  }
  return ids;
}

async function ensureFits(tx: Tx, names: string[]): Promise<Map<string, number>> {
  const ids = new Map<string, number>();
  if (!names.length) return ids;
  const unique = [...new Set(names)];
  const existing = await tx.select({ id: s.fits.id, name: s.fits.name }).from(s.fits).where(inArray(s.fits.name, unique));
  existing.forEach((r) => ids.set(r.name, r.id));
  const missing = unique.filter((n) => !ids.has(n));
  if (missing.length) {
    const created = await tx
      .insert(s.fits)
      .values(missing.map((name) => ({ name, slug: slugify(name), kind: FIT_KIND_BY_CUT[name] ?? null })))
      .returning({ id: s.fits.id, name: s.fits.name });
    created.forEach((r) => ids.set(r.name, r.id));
  }
  return ids;
}

async function replaceLinks(tx: Tx, link: LinkTable, brandId: string, names: string[], ids: Map<string, number>) {
  await tx.delete(link).where(eq(link.brandId, brandId));
  const rows = [...new Set(names)].map((name, position) => ({ brandId, itemId: ids.get(name)!, position }));
  if (rows.length) await tx.insert(link).values(rows);
}

/** Создаёт или обновляет бренд вместе с магазинами и связями со справочниками */
export async function upsertBrand(tx: Tx, brand: BrandRecord, contentHash: string | null = null) {
  const { themes, styles, decors, printTechniques, values, fits, shops, ...row } = brand;
  const now = new Date();
  await tx
    .insert(s.brands)
    .values({ ...row, contentHash, updatedAt: now })
    .onConflictDoUpdate({ target: s.brands.id, set: { ...row, contentHash, updatedAt: now } });

  const lists = { themes, styles, decors, printTechniques, values };
  for (const key of Object.keys(DICTS) as (keyof typeof DICTS)[]) {
    const d = DICTS[key];
    const ids = await ensureDictValues(tx, d.table, lists[key], d.meta);
    await replaceLinks(tx, d.link, brand.id, lists[key], ids);
  }
  await replaceLinks(tx, s.brandFits, brand.id, fits, await ensureFits(tx, fits));

  await tx.delete(s.brandShops).where(eq(s.brandShops.brandId, brand.id));
  if (shops.length) {
    await tx.insert(s.brandShops).values(
      shops.map((shop, position) => ({
        brandId: brand.id,
        kind: shop.kind,
        url: shop.url,
        name: shop.name,
        promoCode: shop.promoCode,
        utm: shop.kind !== "telegram" && shop.kind !== "vk",
        position,
      })),
    );
  }
}

/** Меняет статус брендов, кроме перечисленных в keep. Возвращает id тех, у кого статус изменился */
export async function setStatusExcept(tx: Tx, keep: string[], status: BrandStatus, onlyFrom: BrandStatus[]): Promise<string[]> {
  const rows = await tx
    .update(s.brands)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        keep.length ? notInArray(s.brands.id, keep) : undefined,
        inArray(s.brands.status, onlyFrom),
      ),
    )
    .returning({ id: s.brands.id });
  return rows.map((r) => r.id);
}

function tagText(link: LinkTable, table: DictTable, brandId: SQL) {
  return sql`(select string_agg(${table.name} || ' ' || coalesce(${table.shortName}, ''), ' ')
    from ${link} join ${table} on ${table.id} = ${link.itemId} where ${link.brandId} = ${brandId})`;
}

/**
 * Пересобирает brands.search_vector (ADR-0001, раздел 4): название, темы, стиль, посадка, ткань,
 * город, ценности, место производства и описание. Вызывать после любой записи бренда.
 */
export async function refreshSearchVectors(tx: Tx, ids: string[]) {
  if (!ids.length) return;
  // Внешняя ссылка из подзапросов — явно с именем таблицы
  const b = sql.raw(`"brands"."id"`);
  const fitNames = sql`(select string_agg(${s.fits.name}, ' ') from ${s.brandFits} join ${s.fits} on ${s.fits.id} = ${s.brandFits.itemId} where ${s.brandFits.brandId} = ${b})`;
  const vec = (weight: "A" | "B" | "C" | "D", expr: SQL) =>
    sql`setweight(to_tsvector('russian', coalesce(${expr}, '')), ${weight})`;
  await tx
    .update(s.brands)
    .set({
      searchVector: sql`${vec("A", sql`${s.brands.name}`)}
        || setweight(to_tsvector('simple', ${s.brands.name}), 'A')
        || ${vec("B", tagText(s.brandThemes, s.themes, b))}
        || ${vec("B", tagText(s.brandStyles, s.styles, b))}
        || ${vec("C", tagText(s.brandDecors, s.decors, b))}
        || ${vec("C", tagText(s.brandValueLinks, s.brandValues, b))}
        || ${vec("C", tagText(s.brandPrintTechniques, s.printTechniques, b))}
        || ${vec("C", fitNames)}
        || ${vec("C", sql`concat_ws(' ', ${s.brands.city}, ${s.brands.fitText}, ${s.brands.fabricComposition}, ${s.brands.madeIn}, ${s.brands.run}, ${s.brands.makerType})`)}
        || ${vec("D", sql`concat_ws(' ', ${s.brands.description}, ${s.brands.story}, ${s.brands.offlineText})`)}`,
    })
    .where(inArray(s.brands.id, ids));
}
