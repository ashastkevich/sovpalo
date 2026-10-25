import Link from "next/link";
import { fabricText, lcFirst, priceText } from "@/lib/format";
import { withCampaign } from "@/lib/filters";
import { FIT_LABEL } from "@/lib/taxonomy";
import type { BrandCard as Card } from "@/server/services/brands";
import { Badge } from "./Badge";
import { Cover } from "./Cover";
import { Highlight } from "./Highlight";
import { ShopButton } from "./ShopButton";

const tagName = (t: { name: string; shortName: string | null }) => t.shortName ?? t.name;

/** Карточка одного вида для всех брендов: ничего не выделяется (FR-3) */
export function BrandCard({ brand: b, from, campaign }: { brand: Card; from: string; campaign: string | null }) {
  const href = withCampaign(`/brands/${b.id}/`, campaign);
  const price = priceText(b.priceFrom, b.priceTo);
  const meta = [b.city, price ? `футболки бренда ${price}` : null].filter(Boolean).join(" · ");
  const fabric = fabricText(b.fabricComposition, b.fabricGsm, b.fabricGsmTo);
  const marks: [string, string][] = [];
  if (b.themes.length) marks.push(["Темы", b.themes.map((t) => lcFirst(tagName(t))).join(", ")]);
  if (b.styles.length) marks.push(["Стиль", b.styles.map((t) => lcFirst(tagName(t))).join(", ")]);
  if (b.fitKinds.length) marks.push(["Посадка", b.fitKinds.map((k) => FIT_LABEL[k]).join(" и ")]);
  if (fabric) marks.push(["Ткань", fabric]);
  const dark = b.styles[0]?.slug === "stritvir" || b.styles[0]?.slug === "granzh";

  return (
    <article className="card">
      <Link className="cover-link" href={href} tabIndex={-1} aria-hidden="true">
        <Cover id={b.id} ink={b.themes[0]?.color ?? null} dark={dark} />
      </Link>
      <div className="cbody">
        <h3>
          <Link href={href}>
            <Highlight text={b.nameHl} />
          </Link>
        </h3>
        {meta && <p className="cmeta">{meta}</p>}
        {b.descriptionHl && (
          <p className="cdesc">
            <Highlight text={b.descriptionHl} />
          </p>
        )}
        {marks.length > 0 && (
          <div className="why">
            <span className="label">У бренда</span>
            <ul className="marks">
              {marks.map(([k, v]) => (
                <li key={k}>
                  <b>{k}:</b> {v}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="cfoot">
          <Badge kind={b.originality} licenseConfirmed={b.licenseConfirmed} />
          <span className="row">
            <Link className="btn sm" href={href}>
              О бренде
            </Link>
            {b.shop && <ShopButton brandId={b.id} shop={b.shop} from={from} campaign={campaign} short primary />}
          </span>
        </div>
      </div>
    </article>
  );
}

export function BrandGrid({ brands, from, campaign }: { brands: Card[]; from: string; campaign: string | null }) {
  return (
    <div className="grid">
      {brands.map((b) => (
        <BrandCard key={b.id} brand={b} from={from} campaign={campaign} />
      ))}
    </div>
  );
}
