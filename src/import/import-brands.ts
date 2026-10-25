/**
 * Импорт брендов из JSON (ADR-0001, раздел 3):
 * 1) весь файл проверяется по схеме — при любой ошибке в базу ничего не пишется;
 * 2) upsert по id в одной транзакции; бренды, которых нет в файле, уходят в hold (если не --keep-missing);
 * 3) значения справочников создаются автоматически;
 * 4) итог пишется в imports. Повторный запуск с тем же файлом ничего не меняет.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { inArray, sql } from "drizzle-orm";
import type { Db } from "@/db";
import * as s from "@/db/schema";
import { refreshSearchVectors, setStatusExcept, upsertBrand } from "@/server/services/brands/write";
import type { BrandRecord, ShopRecord } from "@/server/services/brands/types";
import { type BrandInput, type ValidationError, brandsFileSchema, describeIssues } from "./schema";

export type ImportOptions = { dryRun: boolean; keepMissing: boolean };

export type ImportReport = {
  file: string;
  dryRun: boolean;
  total: number;
  added: string[];
  updated: string[];
  unchanged: string[];
  hidden: string[];
};

export type ImportResult = { ok: true; report: ImportReport } | { ok: false; errors: ValidationError[] };

const SHOP_FIELDS = ["site", "wildberries", "ozon", "yandex_market", "lamoda", "telegram", "vk"] as const;

/** JSON-формат выгрузки → запись сервисного слоя */
export function toBrandRecord(b: BrandInput): BrandRecord {
  const shops: ShopRecord[] = [];
  for (const kind of SHOP_FIELDS) {
    const url = b.buy[kind];
    if (url) shops.push({ kind, url, name: null, promoCode: null });
  }
  if (b.buy.multibrand) shops.push({ kind: "multibrand", url: b.buy.multibrand.url, name: b.buy.multibrand.name, promoCode: null });
  return {
    id: b.id,
    name: b.name,
    city: b.city,
    status: b.status ?? "showcase",
    description: b.texts.description,
    story: b.texts.story,
    priceFrom: b.price.from,
    priceTo: b.price.to,
    makerType: b.maker.type,
    madeIn: b.maker.made_in,
    run: b.maker.run,
    fitText: b.fit.text,
    sizes: b.fit.sizes,
    neck: b.fit.neck,
    fabricGsm: b.fabric.gsm,
    fabricGsmTo: b.fabric.gsm_to,
    fabricComposition: b.fabric.composition,
    cotton100: b.fabric.cotton100,
    originality: b.originality.kind,
    licenseConfirmed: b.originality.license_confirmed,
    licenseHolder: b.originality.license_holder,
    color: b.color ?? null,
    cover: null,
    hasOffline: b.buy.offline != null,
    offlineText: typeof b.buy.offline === "string" ? b.buy.offline : null,
    sellsInSocial: b.buy.sells_in_social,
    dataSource: b.data.source,
    checkedAt: b.data.checked,
    notionId: b.data.notion_id,
    themes: b.taste.themes,
    styles: b.taste.styles,
    decors: b.taste.decor,
    printTechniques: b.maker.print,
    values: b.maker.values,
    fits: b.fit.cut,
    shops,
  };
}

const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");

export function recordHash(r: BrandRecord): string {
  return sha256(JSON.stringify(r));
}

export function validateBrandsFile(raw: unknown): { ok: true; records: BrandRecord[]; schemaVersion: string } | { ok: false; errors: ValidationError[] } {
  const parsed = brandsFileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: describeIssues(raw, parsed.error) };
  return { ok: true, records: parsed.data.brands.map(toBrandRecord), schemaVersion: parsed.data.schema_version };
}

export async function importBrands(db: Db, path: string, opts: ImportOptions): Promise<ImportResult> {
  const buf = await readFile(path);
  let raw: unknown;
  try {
    raw = JSON.parse(buf.toString("utf8"));
  } catch (e) {
    return { ok: false, errors: [{ brand: null, field: "(файл)", message: `не JSON: ${(e as Error).message}` }] };
  }
  const v = validateBrandsFile(raw);
  if (!v.ok) return v;

  const report: ImportReport = { file: basename(path), dryRun: opts.dryRun, total: v.records.length, added: [], updated: [], unchanged: [], hidden: [] };
  const ids = v.records.map((r) => r.id);

  class DryRun extends Error {}

  try {
    await db.transaction(async (tx) => {
      // Два импорта одновременно не идут: второй ждёт первого
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('import:brands'))`);
      const existing = new Map(
        (ids.length
          ? await tx.select({ id: s.brands.id, hash: s.brands.contentHash }).from(s.brands).where(inArray(s.brands.id, ids))
          : []
        ).map((r) => [r.id, r.hash]),
      );
      const changed: string[] = [];
      for (const record of v.records) {
        const hash = recordHash(record);
        if (!existing.has(record.id)) report.added.push(record.id);
        else if (existing.get(record.id) !== hash) report.updated.push(record.id);
        else {
          report.unchanged.push(record.id);
          continue;
        }
        changed.push(record.id);
        await upsertBrand(tx, record, hash);
      }
      if (!opts.keepMissing) report.hidden = await setStatusExcept(tx, ids, "hold", ["showcase"]);
      await refreshSearchVectors(tx, changed);

      // dry-run проходит тот же путь и откатывает транзакцию: отчёт точно совпадает с настоящим запуском
      if (opts.dryRun) throw new DryRun();

      if (report.added.length || report.updated.length || report.hidden.length) {
        await tx.insert(s.imports).values({
          file: report.file,
          fileSha256: sha256(buf),
          schemaVersion: v.schemaVersion,
          finishedAt: new Date(),
          added: report.added.length,
          updated: report.updated.length,
          unchanged: report.unchanged.length,
          hidden: report.hidden.length,
          options: opts.keepMissing ? "--keep-missing" : null,
        });
      }
    });
  } catch (e) {
    if (!(e instanceof DryRun)) throw e;
  }
  return { ok: true, report };
}
