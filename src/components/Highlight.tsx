import { splitHighlight } from "@/lib/search";

/** Текст с подсветкой совпадений поиска; отметки ставит ts_headline в сервисе brands */
export function Highlight({ text }: { text: string }) {
  return (
    <>
      {splitHighlight(text).map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : p.text))}
    </>
  );
}
