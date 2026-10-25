import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteUrl } from "@/lib/env";
import { sitemapEntries } from "@/server/services/brands";

/** sitemap.xml из базы: каталог, бренды витрины, посадочные по темам (ADR-0001, раздел 7) */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const { brands, themes } = await sitemapEntries();
  return [
    { url: siteUrl("/") },
    { url: siteUrl("/dlya-brendov/") },
    ...themes.map((t) => ({ url: siteUrl(`/temy/${t.slug}/`) })),
    ...brands.map((b) => ({ url: siteUrl(`/brands/${b.id}/`), lastModified: b.updatedAt })),
  ];
}
