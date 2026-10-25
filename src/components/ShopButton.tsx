import { goHref } from "@/lib/links";
import { SHOP_LABEL } from "@/lib/taxonomy";
import type { ShopRecord } from "@/server/services/brands";

export function shopTitle(shop: ShopRecord, short: boolean): string {
  if (shop.kind === "multibrand" && shop.name) return short ? shop.name : `Магазин ${shop.name}`;
  return SHOP_LABEL[shop.kind][short ? "short" : "label"];
}

/** Обычный a, не Link: предзагрузка Next.js не должна накручивать счётчик переходов (ADR-0001, раздел 5) */
export function ShopButton(props: { brandId: string; shop: ShopRecord; from: string; campaign: string | null; short?: boolean; primary?: boolean }) {
  const { brandId, shop, from, campaign, short = false, primary = false } = props;
  return (
    <a
      className={`btn${primary ? " primary" : ""}${short ? " sm" : ""}`}
      href={goHref(brandId, shop.kind, from, campaign)}
      target="_blank"
      rel="nofollow noopener"
    >
      {shopTitle(shop, short)} <span aria-hidden="true">↗</span>
    </a>
  );
}
