import { connection } from "next/server";
import { siteUrl } from "@/lib/env";
import { sitemapEntries } from "@/server/services/brands";

/** llms.txt: краткое описание сайта для ИИ-агентов (ADR-0001, раздел 7) */
export async function GET() {
  await connection();
  const { themes } = await sitemapEntries();
  const body = `# Совпало

> Каталог российских брендов футболок с авторским дизайном или официальной лицензией. Единица каталога — страница бренда, а не товар. Все бренды на одних условиях, порядок карточек случайный, место в каталоге купить нельзя. Сами мы ничего не продаём: покупка проходит на сайте бренда или на площадке.

## Разделы

- [Все бренды](${siteUrl("/")}): каталог с фильтрами по темам принтов, стилю, посадке, ткани, цене и месту покупки. Фильтры передаются параметрами адреса.
- [Для брендов](${siteUrl("/dlya-brendov/")}): условия размещения — одна цена для всех, без ставок и платных мест.
- [Карта сайта](${siteUrl("/sitemap.xml")}): адреса всех страниц брендов вида /brands/<id>/.

## Темы

${themes.map((t) => `- [${t.name}](${siteUrl(`/temy/${t.slug}/`)})`).join("\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
