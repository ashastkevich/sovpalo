/**
 * Фильтры каталога живут в параметрах адреса: работают без JS, ссылкой можно поделиться,
 * на них же строятся посадочные страницы (ADR-0001, раздел 1; FR-30).
 */
import type { CatalogFilters } from "@/server/services/brands/types";
import { BUDGETS, BUY_FILTER, type BuyFilter, FIT_KINDS, type FitKind } from "./taxonomy";
import { MAX_QUERY_LENGTH } from "./search";

export type SearchParams = Record<string, string | string[] | undefined>;

export const PARAM = {
  q: "q",
  themes: "tema",
  styles: "stil",
  fits: "posadka",
  fabric: "tkan",
  price: "cena",
  buy: "kupit",
  seed: "p",
  campaign: "c",
} as const;

const SLUG = /^[a-z0-9-]{1,64}$/;
const SEED = /^[a-z0-9]{4,16}$/;
const CAMPAIGN = /^[\w.-]{1,64}$/;

function all(sp: SearchParams, key: string): string[] {
  const v = sp[key];
  return (Array.isArray(v) ? v : v == null ? [] : [v]).flatMap((x) => x.split(",")).filter(Boolean);
}

function one(sp: SearchParams, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function emptyFilters(): CatalogFilters {
  return { q: "", themes: [], styles: [], fits: [], fabric: [], price: 0, buy: [] };
}

export function parseFilters(sp: SearchParams): CatalogFilters {
  const price = Number(one(sp, PARAM.price));
  return {
    q: one(sp, PARAM.q).trim().slice(0, MAX_QUERY_LENGTH),
    themes: [...new Set(all(sp, PARAM.themes).filter((s) => SLUG.test(s)))],
    styles: [...new Set(all(sp, PARAM.styles).filter((s) => SLUG.test(s)))],
    fits: [...new Set(all(sp, PARAM.fits).filter((s): s is FitKind => (FIT_KINDS as string[]).includes(s)))],
    fabric: [...new Set(all(sp, PARAM.fabric).filter((s): s is "dense" | "cotton" => s === "dense" || s === "cotton"))],
    price: (BUDGETS as readonly number[]).includes(price) ? price : 0,
    buy: [...new Set(all(sp, PARAM.buy).filter((s): s is BuyFilter => (BUY_FILTER as readonly string[]).includes(s)))],
  };
}

export function hasFilters(f: CatalogFilters): boolean {
  return !!f.q || f.themes.length + f.styles.length + f.fits.length + f.fabric.length + f.buy.length > 0 || f.price > 0;
}

/** Сид случайного порядка: из адреса, иначе новый для каждого захода. В браузер не пишется (FR-2) */
export function parseSeed(sp: SearchParams): string | null {
  const s = one(sp, PARAM.seed);
  return SEED.test(s) ? s : null;
}

export function newSeed(): string {
  return Math.random().toString(36).slice(2, 10).padEnd(8, "0");
}

/** Метка кампании Директа: передаётся через параметр внутренних ссылок, потому что в браузер ничего не пишем */
export function parseCampaign(sp: SearchParams): string | null {
  const c = one(sp, PARAM.campaign);
  return CAMPAIGN.test(c) ? c : null;
}

/** Добавляет к внутренней ссылке метку кампании, если она есть */
export function withCampaign(href: string, campaign: string | null): string {
  if (!campaign) return href;
  return href + (href.includes("?") ? "&" : "?") + `${PARAM.campaign}=${encodeURIComponent(campaign)}`;
}
