import { connection } from "next/server";
import { type SearchParams, hasFilters, newSeed, parseCampaign, parseFilters, parseSeed } from "@/lib/filters";
import { brandsCount } from "@/lib/format";
import { siteUrl } from "@/lib/env";
import { catalogFacets, listCatalog } from "@/server/services/brands";
import { BrandGrid } from "./BrandCard";
import { FilterPanel } from "./FilterPanel";
import { JsonLd } from "./JsonLd";
import { SLOGAN_COUNT, Slogan } from "./Slogan";

function seedIndex(seed: string) {
  let n = 0;
  for (const c of seed) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return n % SLOGAN_COUNT;
}

type Landing = { themeSlug: string; title: string; text: string; from: string };

/** Каталог: слоган, фильтры слева, карточки справа (прототип v1.3). Порядок случайный для каждого посетителя (FR-2) */
export async function CatalogView({ searchParams, landing }: { searchParams: Promise<SearchParams>; landing?: Landing }) {
  await connection();
  const sp = await searchParams;
  const filters = parseFilters(sp);
  if (landing && !filters.themes.includes(landing.themeSlug)) filters.themes.push(landing.themeSlug);
  const seed = parseSeed(sp) ?? newSeed();
  const campaign = parseCampaign(sp);
  const [brands, facets] = await Promise.all([listCatalog(filters, seed), catalogFacets()]);
  const from = landing?.from ?? (hasFilters(filters) ? "catalog-filter" : "catalog");

  return (
    <>
      <section className="wrap hero">
        {landing ? (
          <>
            <h1 className="slogan">
              <span>{landing.title}</span>
            </h1>
            <p className="sub">{landing.text}</p>
          </>
        ) : (
          <>
            <Slogan index={seedIndex(seed)} />
            <p className="sub">Каталог независимых брендов футболок. Отберите бренды фильтрами и купите там, где вам удобно.</p>
          </>
        )}
      </section>
      <div className="wrap layout">
        <FilterPanel key={JSON.stringify(filters)} action="/" facets={facets} filters={filters} seed={seed} campaign={campaign} />
        <section className="results" id="results" aria-live="polite">
          <div className="rhead">
            <h2>{brandsCount(brands.length)}</h2>
            <span className="mono">Порядок меняется для каждого посетителя</span>
          </div>
          {brands.length ? (
            <BrandGrid brands={brands} from={from} campaign={campaign} />
          ) : (
            <div className="empty">
              <b>Под эти фильтры брендов нет.</b>
              <p className="hint">
                {filters.q ? "Попробуйте другое слово или сбросьте фильтры." : "Снимите фильтр по ткани или посадке: эти данные есть не у всех брендов."}
              </p>
            </div>
          )}
        </section>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          numberOfItems: brands.length,
          itemListElement: brands.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: siteUrl(`/brands/${b.id}/`), name: b.name })),
        }}
      />
    </>
  );
}

/** Блок «Как устроен каталог» под выдачей */
export function HowBlock() {
  return (
    <section className="wrap how" aria-label="Как устроен каталог">
      <div>
        <h3>Почему порядок случайный</h3>
        <p>Чтобы ни один бренд не стоял первым всегда. Фильтры только убирают бренды из списка, поднять бренд выше нельзя.</p>
      </div>
      <div>
        <h3>Откуда данные</h3>
        <p>Сайты брендов, магазины, Lamoda, Яндекс Маркет и медиа. Если чего-то о бренде не нашли, этот пункт не показываем.</p>
      </div>
      <div>
        <h3>Обложки и метки</h3>
        <p>
          Обложки — макеты каталога: футболку и рисунок рисуем мы по описанию бренда, это не модели брендов. Метка вроде «Авторский
          дизайн» передаёт, что заявил бренд или медиа; по изображениям её ещё не проверяли.
        </p>
      </div>
    </section>
  );
}
