/** Разметка schema.org в JSON-LD (ADR-0001, раздел 7). «<» экранируем, чтобы текст брендов не закрыл тег script */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
