import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { env, siteUrl } from "@/lib/env";

/** До открытия каталога всё запрещено (NFR-7); /go/ закрыт всегда, чтобы роботы не накручивали счётчик */
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  if (!env().SITE_INDEXING) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/go/" },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
