/**
 * Чтение брендов для страниц сайта. На витрину попадают только бренды со статусом showcase (FR-33).
 */
import { type SQL, and, asc, eq, exists, inArray, isNotNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { HL_START, HL_STOP, toTsQuery } from "@/lib/search";
import { type BuyFilter, type FitKind, type ShopKind, FIT_KINDS, SHOP_ORDER } from "@/lib/taxonomy";
import type { BrandCard, BrandPage, CatalogFilters, Facet, ShopRecord, Tag } from "./types";

const showcase = eq(s.brands.status, "showcase");

/** Случайный порядок, свой для каждого посетителя: сид приходит из адреса страницы (FR-2) */
const randomOrder = (seed: string) => sql`md5(${seed} || ${s.brands.id})`;

const SHOP_FOR_BUY: Partial<Record<BuyFilter, ShopKind[]>> = {
  site: ["site"],
  multibrand: ["multibrand"],
  wildberries: ["wildberries"],
  ozon: ["ozon"],
  yandex_market: ["yandex_market"],
  lamoda: ["lamoda"],
  soc: ["telegram", "vk"],
};

function hasTag(link: typeof s.brandThemes, table: typeof s.themes, slugs: string[]) {
  return exists(
    db
      .select({ one: sql`1` })
      .from(link)
      .innerJoin(table, eq(table.id, link.itemId))
      .where(and(eq(link.brandId, s.brands.id), inArray(table.slug, slugs))),
  );
}

function buyCondition(kind: BuyFilter): SQL | undefined {
  if (kind === "offline") return eq(s.brands.hasOffline, true);
  if (kind === "soc") return eq(s.brands.sellsInSocial, true);
  const shops = SHOP_FOR_BUY[kind]!;
  return exists(
    db
      .select({ one: sql`1` })
      .from(s.brandShops)
      .where(and(eq(s.brandShops.brandId, s.brands.id), inArray(s.brandShops.kind, shops))),
  );
}

function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function filterConditions(f: CatalogFilters, tsquery: SQL | null): SQL[] {
  const c: SQL[] = [];
  const q = f.q.trim();
  if (q) {
    const byName = sql`${s.brands.name} ilike ${"%" + escapeLike(q) + "%"}`;
    c.push(tsquery ? or(sql`${s.brands.searchVector} @@ ${tsquery}`, byName)! : byName);
  }
  if (f.themes.length) c.push(hasTag(s.brandThemes, s.themes, f.themes));
  if (f.styles.length) c.push(hasTag(s.brandStyles, s.styles, f.styles));
  if (f.fits.length) {
    c.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(s.brandFits)
          .innerJoin(s.fits, eq(s.fits.id, s.brandFits.itemId))
          .where(and(eq(s.brandFits.brandId, s.brands.id), inArray(s.fits.kind, f.fits))),
      ),
    );
  }
  // Бренды без данных о ткани при фильтре по ткани скрываются (FR-5)
  if (f.fabric.includes("dense")) c.push(sql`${s.brands.fabricGsm} >= 200`);
  if (f.fabric.includes("cotton")) c.push(eq(s.brands.cotton100, true));
  if (f.price > 0) c.push(and(isNotNull(s.brands.priceFrom), lte(s.brands.priceFrom, f.price))!);
  if (f.buy.length) c.push(or(...f.buy.map(buyCondition))!);
  return c;
}

async function tagsFor(link: typeof s.brandThemes, table: typeof s.themes, ids: string[]) {
  const map = new Map<string, Tag[]>();
  if (!ids.length) return map;
  const rows = await db
    .select({ brandId: link.brandId, slug: table.slug, name: table.name, shortName: table.shortName, color: table.color })
    .from(link)
    .innerJoin(table, eq(table.id, link.itemId))
    .where(inArray(link.brandId, ids))
    .orderBy(asc(link.position));
  for (const { brandId, ...tag } of rows) map.set(brandId, [...(map.get(brandId) ?? []), tag]);
  return map;
}

async function shopsFor(ids: string[]) {
  const map = new Map<string, ShopRecord[]>();
  if (!ids.length) return map;
  const rows = await db
    .select({ brandId: s.brandShops.brandId, kind: s.brandShops.kind, url: s.brandShops.url, name: s.brandShops.name, promoCode: s.brandShops.promoCode })
    .from(s.brandShops)
    .where(inArray(s.brandShops.brandId, ids))
    .orderBy(asc(s.brandShops.position));
  for (const { brandId, ...shop } of rows) map.set(brandId, [...(map.get(brandId) ?? []), shop]);
  for (const list of map.values()) list.sort((a, b) => SHOP_ORDER.indexOf(a.kind) - SHOP_ORDER.indexOf(b.kind));
  return map;
}

async function fitKindsFor(ids: string[]) {
  const map = new Map<string, FitKind[]>();
  if (!ids.length) return map;
  const rows = await db
    .selectDistinct({ brandId: s.brandFits.brandId, kind: s.fits.kind })
    .from(s.brandFits)
    .innerJoin(s.fits, eq(s.fits.id, s.brandFits.itemId))
    .where(and(inArray(s.brandFits.brandId, ids), isNotNull(s.fits.kind)));
  for (const r of rows) map.set(r.brandId, [...(map.get(r.brandId) ?? []), r.kind!]);
  for (const list of map.values()) list.sort((a, b) => FIT_KINDS.indexOf(a) - FIT_KINDS.indexOf(b));
  return map;
}

/** Кнопка магазина на карточке: сначала тот, что выбран в фильтре «Где купить», потом сайт и площадки */
export function bestShop(shops: ShopRecord[], sellsInSocial: boolean, buy: BuyFilter[]): ShopRecord | null {
  if (buy.length) {
    const want = buy.flatMap((k) => SHOP_FOR_BUY[k] ?? []);
    const hit = shops.find((x) => want.includes(x.kind) && (x.kind !== "telegram" || sellsInSocial));
    if (hit) return hit;
  }
  const shop = shops.find((x) => x.kind !== "telegram" && x.kind !== "vk");
  return shop ?? (sellsInSocial ? shops[0] : null) ?? shops[0] ?? null;
}

const cardColumns = {
  id: s.brands.id,
  name: s.brands.name,
  city: s.brands.city,
  priceFrom: s.brands.priceFrom,
  priceTo: s.brands.priceTo,
  description: s.brands.description,
  fabricGsm: s.brands.fabricGsm,
  fabricGsmTo: s.brands.fabricGsmTo,
  fabricComposition: s.brands.fabricComposition,
  originality: s.brands.originality,
  licenseConfirmed: s.brands.licenseConfirmed,
  sellsInSocial: s.brands.sellsInSocial,
};

type CardRow = Omit<BrandCard, "nameHl" | "descriptionHl" | "themes" | "styles" | "fitKinds" | "shop"> & {
  sellsInSocial: boolean;
  nameHl?: string;
  descriptionHl?: string | null;
};

async function toCards(rows: CardRow[], buy: BuyFilter[]): Promise<BrandCard[]> {
  const ids = rows.map((r) => r.id);
  const [themes, styles, fitKinds, shops] = await Promise.all([
    tagsFor(s.brandThemes, s.themes, ids),
    tagsFor(s.brandStyles, s.styles, ids),
    fitKindsFor(ids),
    shopsFor(ids),
  ]);
  return rows.map(({ sellsInSocial, nameHl, descriptionHl, ...r }) => ({
    ...r,
    nameHl: nameHl ?? r.name,
    descriptionHl: descriptionHl ?? r.description,
    themes: themes.get(r.id) ?? [],
    styles: styles.get(r.id) ?? [],
    fitKinds: fitKinds.get(r.id) ?? [],
    shop: bestShop(shops.get(r.id) ?? [], sellsInSocial, buy),
  }));
}

/** Каталог: бренды витрины под фильтрами, в случайном порядке посетителя; совпадения поиска отмечены */
export async function listCatalog(filters: CatalogFilters, seed: string): Promise<BrandCard[]> {
  const tsText = filters.q ? toTsQuery(filters.q) : null;
  const tsquery = tsText ? sql`to_tsquery('russian', ${tsText})` : null;
  const opts = `StartSel=${HL_START}, StopSel=${HL_STOP}, HighlightAll=true`;
  const rows = await db
    .select({
      ...cardColumns,
      ...(tsquery
        ? {
            nameHl: sql<string>`ts_headline('russian', ${s.brands.name}, ${tsquery}, ${opts})`,
            descriptionHl: sql<string | null>`ts_headline('russian', ${s.brands.description}, ${tsquery}, ${opts})`,
          }
        : {}),
    })
    .from(s.brands)
    .where(and(showcase, ...filterConditions(filters, tsquery)))
    .orderBy(randomOrder(seed));
  return toCards(rows as CardRow[], filters.buy);
}

export async function countShowcase(): Promise<number> {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.brands).where(showcase);
  return n;
}

async function tagFacets(link: typeof s.brandThemes, table: typeof s.themes): Promise<Facet[]> {
  return db
    .select({
      slug: table.slug,
      name: table.name,
      shortName: table.shortName,
      color: table.color,
      count: sql<number>`count(distinct ${s.brands.id})::int`,
    })
    .from(table)
    .innerJoin(link, eq(link.itemId, table.id))
    .innerJoin(s.brands, and(eq(s.brands.id, link.brandId), showcase))
    .groupBy(table.id)
    .orderBy(sql`count(distinct ${s.brands.id}) desc`, asc(table.name));
}

export type CatalogFacets = {
  themes: Facet[];
  styles: Facet[];
  fits: { kind: FitKind; count: number }[];
  dense: number;
  cotton: number;
  buy: { kind: BuyFilter; count: number }[];
};

/** Значения фильтров с числом брендов витрины у каждого, как в прототипе */
export async function catalogFacets(): Promise<CatalogFacets> {
  const [themes, styles, fitRows, [fabric], shopRows, [flags]] = await Promise.all([
    tagFacets(s.brandThemes, s.themes),
    tagFacets(s.brandStyles, s.styles),
    db
      .select({ kind: s.fits.kind, count: sql<number>`count(distinct ${s.brands.id})::int` })
      .from(s.fits)
      .innerJoin(s.brandFits, eq(s.brandFits.itemId, s.fits.id))
      .innerJoin(s.brands, and(eq(s.brands.id, s.brandFits.brandId), showcase))
      .where(isNotNull(s.fits.kind))
      .groupBy(s.fits.kind),
    db
      .select({
        dense: sql<number>`count(*) filter (where ${s.brands.fabricGsm} >= 200)::int`,
        cotton: sql<number>`count(*) filter (where ${s.brands.cotton100})::int`,
      })
      .from(s.brands)
      .where(showcase),
    db
      .select({ kind: s.brandShops.kind, count: sql<number>`count(distinct ${s.brands.id})::int` })
      .from(s.brandShops)
      .innerJoin(s.brands, and(eq(s.brands.id, s.brandShops.brandId), showcase))
      .groupBy(s.brandShops.kind),
    db
      .select({
        soc: sql<number>`count(*) filter (where ${s.brands.sellsInSocial})::int`,
        offline: sql<number>`count(*) filter (where ${s.brands.hasOffline})::int`,
      })
      .from(s.brands)
      .where(showcase),
  ]);
  const byShop = new Map(shopRows.map((r) => [r.kind, r.count]));
  const buy = (["site", "multibrand", "wildberries", "ozon", "yandex_market", "lamoda", "soc", "offline"] as BuyFilter[])
    .map((kind) => ({
      kind,
      count: kind === "soc" ? flags.soc : kind === "offline" ? flags.offline : (byShop.get(kind as ShopKind) ?? 0),
    }))
    .filter((x) => x.count > 0);
  const fits = FIT_KINDS.map((kind) => ({ kind, count: fitRows.find((r) => r.kind === kind)?.count ?? 0 })).filter((x) => x.count > 0);
  return { themes, styles, fits, dense: fabric.dense, cotton: fabric.cotton, buy };
}

/** Страница бренда; бренды не с витрины не показываем */
export async function getBrand(id: string): Promise<BrandPage | null> {
  const [row] = await db.select().from(s.brands).where(and(eq(s.brands.id, id), showcase));
  if (!row) return null;
  const ids = [id];
  const plain = async (link: typeof s.brandThemes, table: typeof s.themes) => ((await tagsFor(link, table, ids)).get(id) ?? []).map((t) => t.name);
  const [themes, styles, decors, printTechniques, values, fits, shops] = await Promise.all([
    tagsFor(s.brandThemes, s.themes, ids),
    tagsFor(s.brandStyles, s.styles, ids),
    tagsFor(s.brandDecors, s.decors, ids),
    plain(s.brandPrintTechniques, s.printTechniques),
    plain(s.brandValueLinks, s.brandValues),
    db
      .select({ name: s.fits.name })
      .from(s.brandFits)
      .innerJoin(s.fits, eq(s.fits.id, s.brandFits.itemId))
      .where(eq(s.brandFits.brandId, id))
      .orderBy(asc(s.brandFits.position)),
    shopsFor(ids),
  ]);
  const { searchVector, contentHash, createdAt, ...brand } = row;
  void searchVector;
  void contentHash;
  void createdAt;
  return {
    ...brand,
    themes: themes.get(id) ?? [],
    styles: styles.get(id) ?? [],
    decors: decors.get(id) ?? [],
    printTechniques,
    values,
    fits: fits.map((f) => f.name),
    shops: shops.get(id) ?? [],
  };
}

/** «Похожие по вкусу»: общие темы весят 2, стиль 1, декор 0,5; не меньше 1,5, до трёх брендов */
export async function similarBrands(id: string, seed: string): Promise<BrandCard[]> {
  const shared = (link: typeof s.brandThemes, weight: number) => {
    const item = sql.identifier(link.itemId.name);
    return sql`
    select o.brand_id, ${weight}::numeric as w from ${link} o
    join ${link} me on me.${item} = o.${item} and me.brand_id = ${id}
    where o.brand_id <> ${id}`;
  };
  const scores = sql`(${shared(s.brandThemes, 2)} union all ${shared(s.brandStyles, 1)} union all ${shared(s.brandDecors, 0.5)})`;
  const scored = db.$with("scored").as(
    db
      .select({ brandId: sql<string>`sc.brand_id`.as("brand_id"), score: sql<number>`sum(sc.w)`.as("score") })
      .from(sql`${scores} sc`)
      .groupBy(sql`sc.brand_id`),
  );
  const rows = await db
    .with(scored)
    .select(cardColumns)
    .from(s.brands)
    .innerJoin(scored, eq(scored.brandId, s.brands.id))
    .where(and(showcase, sql`${scored.score} >= 1.5`))
    .orderBy(sql`${scored.score} desc`, randomOrder(seed))
    .limit(3);
  return toCards(rows as CardRow[], []);
}

export async function getThemeBySlug(slug: string): Promise<Facet | null> {
  const list = await tagFacets(s.brandThemes, s.themes);
  return list.find((t) => t.slug === slug) ?? null;
}

/** Для sitemap.xml: бренды витрины и темы, у которых есть бренды */
export async function sitemapEntries() {
  const [brandRows, themeRows] = await Promise.all([
    db.select({ id: s.brands.id, updatedAt: s.brands.updatedAt }).from(s.brands).where(showcase).orderBy(asc(s.brands.id)),
    tagFacets(s.brandThemes, s.themes),
  ]);
  return { brands: brandRows, themes: themeRows.filter((t) => t.count > 0) };
}

/** Ссылка магазина для /go/: только у брендов витрины */
export async function getShopLink(brandId: string, kind: ShopKind) {
  const [row] = await db
    .select({ url: s.brandShops.url, utm: s.brandShops.utm, promoCode: s.brandShops.promoCode })
    .from(s.brandShops)
    .innerJoin(s.brands, and(eq(s.brands.id, s.brandShops.brandId), showcase))
    .where(and(eq(s.brandShops.brandId, brandId), eq(s.brandShops.kind, kind)));
  return row ?? null;
}

