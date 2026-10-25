import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Fragment } from "react";
import { Badge, originalityShown } from "@/components/Badge";
import { BrandGrid } from "@/components/BrandCard";
import { Cover } from "@/components/Cover";
import { JsonLd } from "@/components/JsonLd";
import { ShopButton } from "@/components/ShopButton";
import { env, siteUrl } from "@/lib/env";
import { type SearchParams, newSeed, parseCampaign, withCampaign } from "@/lib/filters";
import { gsmText, priceText, ruDate } from "@/lib/format";
import { ORIGINALITY_TEXT } from "@/lib/taxonomy";
import { getBrand, similarBrands } from "@/server/services/brands";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const b = await getBrand(id);
  if (!b) return { title: "Бренд не найден", robots: { index: false } };
  const description = [b.description, b.city].filter(Boolean).join(" · ").slice(0, 300) || undefined;
  return {
    title: b.name,
    description,
    alternates: { canonical: siteUrl(`/brands/${b.id}/`) },
    openGraph: { title: `${b.name} · Совпало`, description, url: siteUrl(`/brands/${b.id}/`) },
  };
}

/**
 * Страница ждёт данные бренда целиком: поисковик получает готовый HTML.
 * Неизвестный или скрытый бренд показывает «Такой страницы нет» с noindex (статус — см. docs/it/development.md, «Известные ограничения»).
 */
export const instant = false;

export default async function BrandPage({ params, searchParams }: Props) {
  await connection();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const b = await getBrand(id);
  if (!b) notFound();
  const campaign = parseCampaign(sp);
  const similar = await similarBrands(b.id, newSeed());

  const price = priceText(b.priceFrom, b.priceTo);
  const eyebrow = [b.city, b.makerType].filter(Boolean).join(" · ");
  const orig = originalityShown(b.originality, b.licenseConfirmed);
  const passport: [string, string | null][] = [
    ["Посадка", b.fitText ?? (b.fits.length ? b.fits.join(", ") : null)],
    ["Плотность", gsmText(b.fabricGsm, b.fabricGsmTo)],
    ["Состав", b.fabricComposition],
    ["Размеры", b.sizes],
    ["Техника нанесения", b.printTechniques.join(", ") || null],
    ["Горловина и швы", b.neck],
    ["Где сделано", b.madeIn],
    ["Тираж", b.run],
    ["Ценности", b.values.join(", ") || null],
  ];
  // Пункты без данных скрываем (FR-11)
  const rows = passport.filter((r): r is [string, string] => !!r[1]);
  const taste = [
    ["Темы", b.themes],
    ["Стиль", b.styles],
    ["Декор", b.decors],
  ] as const;
  const dark = b.styles[0]?.slug === "stritvir" || b.styles[0]?.slug === "granzh";
  const home = withCampaign("/", campaign);

  return (
    <div className="wrap bp" style={b.color ? { ["--accent" as string]: b.color } : undefined}>
      <Link className="back" href={home}>
        ← Все бренды
      </Link>
      <div className="bp-head">
        <Cover id={b.id} ink={b.themes[0]?.color ?? null} dark={dark} className="bp-cover" />
        <div className="bp-info">
          {eyebrow && <span className="label">{eyebrow}</span>}
          <h1>{b.name}</h1>
          {b.description && <p className="lead">{b.description}</p>}
          {(price || orig) && (
            <div className="price-row">
              {price && (
                <span className="price-big">
                  <span className="label" style={{ display: "block", marginBottom: 4 }}>
                    Футболки бренда
                  </span>
                  {price}
                </span>
              )}
              <Badge kind={b.originality} licenseConfirmed={b.licenseConfirmed} />
            </div>
          )}
          {b.shops.length > 0 && (
            <div className="buy">
              {b.shops.map((shop, i) => (
                <ShopButton key={shop.kind} brandId={b.id} shop={shop} from="brand" campaign={campaign} primary={i === 0} />
              ))}
            </div>
          )}
          {b.hasOffline && <p className="fine">{b.offlineText ? `Есть офлайн: ${b.offlineText.replace(/\.$/, "")}.` : "Есть офлайн-магазины."}</p>}
          <p className="fine">
            Покупка проходит на сайте бренда или на площадке. В ссылках метки каталога, чтобы бренд видел переходы; партнёрских меток нет.
          </p>
        </div>
      </div>
      {env().SITE_STAGE === "preview" && (
        <div className="note-box">
          <span className="label">Это ваш бренд?</span>
          <p>
            Мы собрали эту страницу из открытых источников: сайта бренда, магазинов и медиа. Принты бренда не показываем, имена людей
            публикуем только с их согласия. Если что-то неточно или вы не хотите быть в каталоге, напишите нам: исправим или уберём
            страницу.
          </p>
          <Link className="btn sm" href={withCampaign("/dlya-brendov/", campaign)}>
            Как подключиться
          </Link>
        </div>
      )}
      <div className="bp-body">
        {rows.length > 0 && (
          <section className="sec">
            <span className="label">Как сделаны вещи бренда</span>
            <dl className="passport">
              {rows.map(([k, v]) => (
                <Fragment key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </Fragment>
              ))}
            </dl>
          </section>
        )}
        {taste.some(([, list]) => list.length) && (
          <section className="sec">
            <span className="label">Вкус</span>
            <div className="taste-rows">
              {taste
                .filter(([, list]) => list.length)
                .map(([label, list]) => (
                  <div className="taste-row" key={label}>
                    <span className="label">{label}</span>
                    <div className="chips">
                      {list.map((t) => (
                        <span className="chip" key={t.slug} style={{ cursor: "default" }}>
                          {t.color && <span className="sw" style={{ ["--c" as string]: t.color }} />}
                          {t.shortName ?? t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
        {b.story && (
          <section className="sec">
            <span className="label">Кто делает</span>
            <p>{b.story}</p>
          </section>
        )}
        <section className="sec">
          <span className="label">Откуда данные</span>
          {orig && <p>{ORIGINALITY_TEXT[orig]}</p>}
          <p className="fine">
            Данные из открытых источников{b.checkedAt ? `, проверено ${ruDate(b.checkedAt)}` : ""}. Обложка — макет каталога: футболку и
            рисунок нарисовали мы по описанию бренда. Такой модели у бренда нет, настоящие вещи — на сайте бренда.
          </p>
        </section>
        <div className="fbk">
          <span>Здесь покупатель сможет сообщить нам, если с заказом что-то пошло не так. Публично это не показываем, а передаём бренду.</span>
        </div>
        {similar.length > 0 && (
          <section className="sec wide">
            <span className="label">Похожие по вкусу</span>
            <BrandGrid brands={similar} from="similar" campaign={campaign} />
          </section>
        )}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Brand",
              "@id": siteUrl(`/brands/${b.id}/#brand`),
              name: b.name,
              description: b.description ?? undefined,
              url: siteUrl(`/brands/${b.id}/`),
              sameAs: b.shops.filter((x) => x.kind === "site").map((x) => x.url),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Все бренды", item: siteUrl("/") },
                { "@type": "ListItem", position: 2, name: b.name, item: siteUrl(`/brands/${b.id}/`) },
              ],
            },
          ],
        }}
      />
    </div>
  );
}
