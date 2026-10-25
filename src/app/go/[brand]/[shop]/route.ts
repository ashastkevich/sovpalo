import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { withUtm } from "@/lib/links";
import { SHOP_ORDER, type ShopKind } from "@/lib/taxonomy";
import { getShopLink } from "@/server/services/brands";
import { isCountable } from "@/lib/click-guard";
import { countClick } from "@/server/services/clicks";

const SOURCE = /^[\w:.-]{1,64}$/;
const CAMPAIGN = /^[\w.-]{1,64}$/;

/** /go/<бренд>/<магазин>?from=…&c=…: +1 в click_daily и 302 в магазин с UTM-метками (ADR-0001, раздел 5) */
export async function GET(req: NextRequest, ctx: { params: Promise<{ brand: string; shop: string }> }) {
  const { brand, shop } = await ctx.params;
  if (!(SHOP_ORDER as string[]).includes(shop)) return new NextResponse("Not found", { status: 404 });
  const link = await getShopLink(brand, shop as ShopKind);
  if (!link) return new NextResponse("Not found", { status: 404 });

  const from = req.nextUrl.searchParams.get("from") ?? "";
  const c = req.nextUrl.searchParams.get("c") ?? "";
  const source = SOURCE.test(from) ? from : "";
  const campaign = CAMPAIGN.test(c) ? c : "";

  if (isCountable(req.headers, new URL(env().SITE_URL).host)) {
    try {
      await countClick({ brandId: brand, shop: shop as ShopKind, source, campaign });
    } catch (e) {
      // Покупатель должен попасть в магазин, даже если счётчик не записался
      console.error("click_daily: не удалось записать переход", e);
    }
  }

  const target = link.utm ? withUtm(link.url, shop as ShopKind, brand, campaign || null) : link.url;
  return NextResponse.redirect(target, {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
