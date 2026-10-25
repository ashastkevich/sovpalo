import type { ShopKind } from "./taxonomy";
import { NO_UTM_SHOPS } from "./taxonomy";

/**
 * Кнопка магазина ведёт на свой домен: /go/<бренд>/<магазин>?from=…&c=… (ADR-0001, раздел 5).
 * Обычный тег a с rel="nofollow", не компонент Link: предзагрузка не должна накручивать счёт.
 */
export function goHref(brandId: string, shop: ShopKind, from: string, campaign: string | null): string {
  const p = new URLSearchParams({ from });
  if (campaign) p.set("c", campaign);
  return `/go/${brandId}/${shop}/?${p}`;
}

/** UTM-метки каталога для ссылки магазина; к Telegram и VK не добавляем (FR-18) */
export function withUtm(url: string, shop: ShopKind, brandId: string, campaign: string | null): string {
  if (NO_UTM_SHOPS.has(shop)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "sovpalo");
    u.searchParams.set("utm_medium", "catalog");
    u.searchParams.set("utm_campaign", campaign ?? "catalog");
    u.searchParams.set("utm_content", brandId);
    return u.toString();
  } catch {
    return url;
  }
}
