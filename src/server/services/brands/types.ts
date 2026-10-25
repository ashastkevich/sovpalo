import type { BuyFilter, FitKind, ShopKind } from "@/lib/taxonomy";

export type BrandStatus = "showcase" | "hold" | "reserve";
export type Originality = "original" | "original_licensed" | "licensed";

export type ShopRecord = { kind: ShopKind; url: string; name: string | null; promoCode: string | null };

/**
 * Бренд в том виде, в каком его пишет сервисный слой.
 * Импорт из JSON и будущая админка приводят свои данные к этой форме.
 */
export type BrandRecord = {
  id: string;
  name: string;
  city: string | null;
  status: BrandStatus;
  description: string | null;
  story: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  makerType: string | null;
  madeIn: string | null;
  run: string | null;
  fitText: string | null;
  sizes: string | null;
  neck: string | null;
  fabricGsm: number | null;
  fabricGsmTo: number | null;
  fabricComposition: string | null;
  cotton100: boolean | null;
  originality: Originality | null;
  licenseConfirmed: boolean;
  licenseHolder: string | null;
  color: string | null;
  cover: string | null;
  hasOffline: boolean;
  offlineText: string | null;
  sellsInSocial: boolean;
  dataSource: string | null;
  checkedAt: string | null;
  notionId: string | null;
  themes: string[];
  styles: string[];
  decors: string[];
  printTechniques: string[];
  values: string[];
  /** Посадки как в данных бренда: «Оверсайз», «Прямой» */
  fits: string[];
  shops: ShopRecord[];
};

export type CatalogFilters = {
  q: string;
  themes: string[];
  styles: string[];
  fits: FitKind[];
  fabric: ("dense" | "cotton")[];
  /** Цена «от» не выше; 0 — любая */
  price: number;
  buy: BuyFilter[];
};

export type Tag = { slug: string; name: string; shortName: string | null; color: string | null };

export type BrandCard = {
  id: string;
  name: string;
  /** Название с отметками совпадений поиска, см. lib/highlight */
  nameHl: string;
  city: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  description: string | null;
  descriptionHl: string | null;
  themes: Tag[];
  styles: Tag[];
  fitKinds: FitKind[];
  fabricGsm: number | null;
  fabricGsmTo: number | null;
  fabricComposition: string | null;
  originality: Originality | null;
  licenseConfirmed: boolean;
  shop: ShopRecord | null;
};

export type BrandPage = Omit<BrandRecord, "themes" | "styles" | "decors" | "printTechniques" | "values" | "fits"> & {
  themes: Tag[];
  styles: Tag[];
  decors: Tag[];
  printTechniques: string[];
  values: string[];
  fits: string[];
  updatedAt: Date;
};

export type Facet = Tag & { count: number };
