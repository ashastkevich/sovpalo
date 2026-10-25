/**
 * Схема базы данных (ADR-0001, раздел 2).
 * Страницы не обращаются к таблицам напрямую — только через сервисный слой в src/server/services.
 */
import {
  type AnyPgColumn,
  boolean,
  customType,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

/** showcase — на витрине, hold — скрыт с витрины, reserve — в резерве (FR-33) */
export const brandStatus = pgEnum("brand_status", ["showcase", "hold", "reserve"]);

/** Заявление об оригинальности: свой дизайн, свой + лицензия, лицензионный мерч */
export const originalityKind = pgEnum("originality_kind", ["original", "original_licensed", "licensed"]);

/** Тип магазина бренда; он же сегмент адреса /go/<бренд>/<магазин> */
export const shopKind = pgEnum("shop_kind", [
  "site",
  "multibrand",
  "wildberries",
  "ozon",
  "yandex_market",
  "lamoda",
  "telegram",
  "vk",
]);

/** Группа посадки для фильтра (FR-4): свободная, классическая, приталенная, укороченная */
export const fitKind = pgEnum("fit_kind", ["free", "classic", "fitted", "cropped"]);

export const brands = pgTable(
  "brands",
  {
    /** slug, он же адрес /brands/<id>/ */
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    city: text("city"),
    status: brandStatus("status").notNull().default("showcase"),
    description: text("description"),
    story: text("story"),
    priceFrom: integer("price_from"),
    priceTo: integer("price_to"),

    // Паспорт: кто и как делает
    makerType: text("maker_type"),
    madeIn: text("made_in"),
    run: text("run"),
    fitText: text("fit_text"),
    sizes: text("sizes"),
    neck: text("neck"),
    fabricGsm: smallint("fabric_gsm"),
    fabricGsmTo: smallint("fabric_gsm_to"),
    fabricComposition: text("fabric_composition"),
    cotton100: boolean("cotton100"),

    // Метки «Авторский дизайн» и «Лицензия» (FR-12)
    originality: originalityKind("originality"),
    licenseConfirmed: boolean("license_confirmed").notNull().default(false),
    licenseHolder: text("license_holder"),

    /** Акцентный цвет страницы бренда, #RRGGBB (FR-20) */
    color: text("color"),
    /** Путь к обложке; пока null — рисуем макет каталога (FR-13) */
    cover: text("cover"),

    hasOffline: boolean("has_offline").notNull().default(false),
    /** Где офлайн-точки; null при hasOffline — «есть офлайн-магазины» без подробностей */
    offlineText: text("offline_text"),
    sellsInSocial: boolean("sells_in_social").notNull().default(false),

    dataSource: text("data_source"),
    checkedAt: date("checked_at"),
    notionId: text("notion_id"),

    /** Хеш данных бренда из последнего импорта: по нему импорт понимает, что менять нечего */
    contentHash: text("content_hash"),
    /** Собирается сервисом brands (refreshSearchVectors), конфигурация russian (ADR-0001, раздел 4) */
    searchVector: tsvector("search_vector"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("brands_status_idx").on(t.status),
    index("brands_search_idx").using("gin", t.searchVector),
  ],
);

export const brandShops = pgTable(
  "brand_shops",
  {
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    kind: shopKind("kind").notNull(),
    url: text("url").notNull(),
    /** Название мультибренда */
    name: text("name"),
    promoCode: text("promo_code"),
    /** Добавлять ли UTM-метки; к Telegram и VK не добавляем (FR-18) */
    utm: boolean("utm").notNull().default(true),
    position: smallint("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.brandId, t.kind] })],
);

/**
 * Справочники вкуса и паспорта. У всех одинаковая форма и один тип, чтобы сервис работал с ними одним кодом:
 * slug для адресов и параметров фильтра, полное и короткое название, цвет образца в фильтре.
 */
function dictionary(name: string) {
  return pgTable(
    name,
    {
      id: serial("id").primaryKey(),
      slug: text("slug").notNull(),
      name: text("name").notNull(),
      shortName: text("short_name"),
      color: text("color"),
      position: smallint("position").notNull().default(0),
    },
    (t) => [uniqueIndex(`${name}_slug_uq`).on(t.slug), uniqueIndex(`${name}_name_uq`).on(t.name)],
  );
}

export const themes = dictionary("themes");
export const styles = dictionary("styles");
export const decors = dictionary("decors");
export const printTechniques = dictionary("print_techniques");
export const brandValues = dictionary("values");

/** Посадки — словарь с привязкой к группе фильтра: «Оверсайз» → free */
export const fits = pgTable(
  "fits",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    kind: fitKind("kind"),
    position: smallint("position").notNull().default(0),
  },
  (t) => [uniqueIndex("fits_slug_uq").on(t.slug), uniqueIndex("fits_name_uq").on(t.name)],
);

function link(name: string, column: string, target: () => AnyPgColumn) {
  return pgTable(
    name,
    {
      brandId: text("brand_id")
        .notNull()
        .references(() => brands.id, { onDelete: "cascade" }),
      itemId: integer(column)
        .notNull()
        .references(target, { onDelete: "restrict" }),
      position: smallint("position").notNull().default(0),
    },
    (t) => [primaryKey({ columns: [t.brandId, t.itemId] }), index(`${name}_item_idx`).on(t.itemId)],
  );
}

export const brandThemes = link("brand_themes", "theme_id", () => themes.id);
export const brandStyles = link("brand_styles", "style_id", () => styles.id);
export const brandDecors = link("brand_decors", "decor_id", () => decors.id);
export const brandPrintTechniques = link("brand_print_techniques", "print_technique_id", () => printTechniques.id);
export const brandValueLinks = link("brand_values", "value_id", () => brandValues.id);
export const brandFits = link("brand_fits", "fit_id", () => fits.id);

/**
 * Счётчик переходов в магазины (ADR-0001, раздел 5; FR-28).
 * Отдельные клики, IP, cookie и User-Agent не храним — только суммы за день.
 */
export const clickDaily = pgTable(
  "click_daily",
  {
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    shop: shopKind("shop").notNull(),
    day: date("day").notNull(),
    /** Откуда перешли: card, brand, similar, landing:<тема> и т. п. */
    source: text("source").notNull().default(""),
    /** Метка кампании Директа из параметра c */
    campaign: text("campaign").notNull().default(""),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.brandId, t.shop, t.day, t.source, t.campaign] }), index("click_daily_day_idx").on(t.day)],
);

/** Журнал применённых импортов из JSON (ADR-0001, раздел 3). Импорт с ошибками в базу ничего не пишет */
export const imports = pgTable("imports", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  file: text("file").notNull(),
  fileSha256: text("file_sha256").notNull(),
  schemaVersion: text("schema_version"),
  added: integer("added").notNull().default(0),
  updated: integer("updated").notNull().default(0),
  unchanged: integer("unchanged").notNull().default(0),
  hidden: integer("hidden").notNull().default(0),
  /** Флаги запуска, например --keep-missing */
  options: text("options"),
});
