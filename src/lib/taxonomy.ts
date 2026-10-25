/**
 * Подписи и оформление справочников, перенесённые из прототипа v1.3.
 * Импорт берёт отсюда короткое название и цвет, когда создаёт новое значение справочника.
 */

export type ShopKind =
  | "site"
  | "multibrand"
  | "wildberries"
  | "ozon"
  | "yandex_market"
  | "lamoda"
  | "telegram"
  | "vk";

export type FitKind = "free" | "classic" | "fitted" | "cropped";

/** Порядок кнопок магазинов на странице бренда */
export const SHOP_ORDER: ShopKind[] = ["site", "multibrand", "wildberries", "ozon", "yandex_market", "lamoda", "telegram", "vk"];

export const SHOP_LABEL: Record<ShopKind, { label: string; short: string }> = {
  site: { label: "Сайт бренда", short: "Сайт" },
  multibrand: { label: "Мультибренды", short: "Магазин" },
  wildberries: { label: "Wildberries", short: "WB" },
  ozon: { label: "Ozon", short: "Ozon" },
  yandex_market: { label: "Яндекс Маркет", short: "Маркет" },
  lamoda: { label: "Lamoda", short: "Lamoda" },
  telegram: { label: "Telegram", short: "Telegram" },
  vk: { label: "VK", short: "VK" },
};

/** Ссылки на соцсети без UTM-меток (FR-18) */
export const NO_UTM_SHOPS = new Set<ShopKind>(["telegram", "vk"]);

/** Фильтр «Где купить»: soc — продаёт через Telegram или VK, offline — есть офлайн-точки */
export const BUY_FILTER = ["site", "multibrand", "wildberries", "ozon", "yandex_market", "lamoda", "soc", "offline"] as const;
export type BuyFilter = (typeof BUY_FILTER)[number];
export const BUY_FILTER_LABEL: Record<BuyFilter, string> = {
  site: "Сайт бренда",
  multibrand: "Мультибренды",
  wildberries: "Wildberries",
  ozon: "Ozon",
  yandex_market: "Яндекс Маркет",
  lamoda: "Lamoda",
  soc: "Telegram, VK",
  offline: "Офлайн",
};

export const FIT_KINDS: FitKind[] = ["free", "classic", "fitted", "cropped"];
export const FIT_LABEL: Record<FitKind, string> = {
  free: "свободная",
  classic: "классическая",
  fitted: "приталенная",
  cropped: "укороченная",
};

/** Посадка из JSON → группа фильтра. Неизвестные значения в фильтр не попадают */
export const FIT_KIND_BY_CUT: Record<string, FitKind> = {
  Оверсайз: "free",
  Свободный: "free",
  Boxy: "free",
  Прямой: "classic",
  Классический: "classic",
  Приталенный: "fitted",
  Укороченный: "cropped",
};

/** Бюджеты фильтра «Цена футболки»: по цене «от» */
export const BUDGETS = [2000, 3000, 4000] as const;

export const THEME_META: Record<string, { short?: string; color?: string }> = {
  "Искусство и иллюстрация": { short: "Искусство", color: "#D9467A" },
  Животные: { color: "#E08A1E" },
  "Город и местная идентичность": { short: "Город", color: "#2A3CCF" },
  Типографика: { color: "#1C1D22" },
  "Русская стилистика": { short: "Русский стиль", color: "#C8321E" },
  "Ретро и Y2K": { short: "Ретро", color: "#F0B323" },
  "Фандомы (лицензия)": { short: "Фандомы", color: "#6B3FB8" },
  Природа: { color: "#13896F" },
  "Юмор и мемы": { short: "Юмор", color: "#F2D23A" },
  "Спорт и хобби": { short: "Спорт", color: "#2E9BD6" },
  "Наука и космос": { short: "Наука", color: "#0E7C9A" },
  "Аниме и Япония": { short: "Восток" },
  "Геометрия и абстракция": { short: "Абстракция" },
};

export const STYLE_META: Record<string, { short?: string; color?: string }> = {
  Стритвир: { color: "#1C1D22" },
  Арт: { color: "#D9467A" },
  Винтаж: { color: "#8E9174" },
  Минимализм: { color: "#F7F6F2" },
  Романтика: { color: "#E79BB0" },
  Гранж: { color: "#5A5148" },
  Спорт: { color: "#2E9BD6" },
};

export const ORIGINALITY_LABEL = {
  original: "Авторский дизайн",
  original_licensed: "Авторский + лицензия",
  licensed: "Лицензионный мерч",
} as const;

export const ORIGINALITY_TEXT = {
  original: "Бренд или медиа заявляют, что принты нарисованы для бренда. По изображениям пока не проверяли.",
  original_licensed: "Свои принты плюс официальные коллаборации с правообладателями. Документы о лицензиях не проверяли.",
  licensed: "Изображения используются по лицензии правообладателя: музея или студии. Документы не проверяли.",
} as const;

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** «Ретро и Y2K» → «retro-i-y2k»: slug для адресов и параметров фильтра */
export function slugify(text: string): string {
  return [...text.toLowerCase()]
    .map((c) => TRANSLIT[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
