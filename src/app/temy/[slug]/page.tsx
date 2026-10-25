import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CatalogView, HowBlock } from "@/components/CatalogView";
import { siteUrl } from "@/lib/env";
import type { SearchParams } from "@/lib/filters";
import { brandsCount, lcFirst } from "@/lib/format";
import { getThemeBySlug } from "@/server/services/brands";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

/** Страница ждёт данные целиком: поисковик получает готовый HTML */
export const instant = false;

/** Посадочная страница с включённым фильтром по теме (FR-30), постоянный адрес для поиска (ADR-0001, раздел 7) */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const theme = await getThemeBySlug((await params).slug);
  if (!theme) return { robots: { index: false } };
  return {
    title: `Футболки с темой «${theme.shortName ?? theme.name}»`,
    description: `${brandsCount(theme.count)} с принтами на тему «${lcFirst(theme.name)}». Порядок случайный, место купить нельзя.`,
    alternates: { canonical: siteUrl(`/temy/${theme.slug}/`) },
  };
}

export default async function ThemeLanding({ params, searchParams }: Props) {
  await connection();
  const theme = await getThemeBySlug((await params).slug);
  if (!theme) notFound();
  return (
    <>
      <CatalogView
        searchParams={searchParams}
        landing={{
          themeSlug: theme.slug,
          title: `Футболки с темой «${theme.shortName ?? theme.name}»`,
          text: `Бренды, у которых есть принты на тему «${lcFirst(theme.name)}». Уточните выбор фильтрами слева и купите там, где вам удобно.`,
          from: `landing:${theme.slug}`,
        }}
      />
      <HowBlock />
    </>
  );
}
