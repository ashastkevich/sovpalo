import type { Metadata } from "next";
import { CatalogView, HowBlock } from "@/components/CatalogView";
import { siteUrl } from "@/lib/env";
import { type SearchParams, hasFilters, parseFilters } from "@/lib/filters";

type Props = { searchParams: Promise<SearchParams> };

/** Каталог собирается целиком на сервере при каждом запросе: порядок случайный (ADR-0001, раздел 1) */
export const instant = false;

/** Комбинации фильтров в параметрах не индексируются и ссылаются на каталог как на canonical (ADR-0001, раздел 7) */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filtered = hasFilters(parseFilters(await searchParams));
  return {
    alternates: { canonical: siteUrl("/") },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default function Home({ searchParams }: Props) {
  return (
    <>
      <CatalogView searchParams={searchParams} />
      <HowBlock />
    </>
  );
}
