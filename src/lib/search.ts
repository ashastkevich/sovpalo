/**
 * Разбор поискового запроса для полнотекстового поиска PostgreSQL (ADR-0001, раздел 4; FR-6).
 * Окончания снимает морфология russian, каждое слово ищется ещё и как начало слова: «косм» найдёт «космос».
 */

const STOP = new Set([
  "и", "в", "во", "с", "со", "на", "для", "про", "по", "о", "об", "от", "из", "к", "а", "или", "не", "без",
  "мне", "хочу", "ищу", "нужна", "нужен", "нужно", "какой", "какие", "где", "что", "как",
]);
/** Слова, которые есть почти у всех брендов: «футболка с котом» ищем как «кот» */
const STOP_PREFIX = ["футболк", "бренд", "принт"];

export const MAX_QUERY_LENGTH = 100;

export function queryTerms(q: string): string[] {
  const words = q.slice(0, MAX_QUERY_LENGTH).toLowerCase().replace(/ё/g, "е").match(/[\p{L}\p{N}]+/gu) ?? [];
  return [...new Set(words)].filter((w) => !STOP.has(w) && !STOP_PREFIX.some((p) => w.startsWith(p))).slice(0, 8);
}

/** Строка для to_tsquery('russian', …): «коты космос» → «коты:* & космос:*». null — искать нечего */
export function toTsQuery(q: string): string | null {
  const terms = queryTerms(q);
  return terms.length ? terms.map((t) => `${t}:*`).join(" & ") : null;
}

/** Метки совпадений, которые ставит ts_headline; в разметку их превращает компонент Highlight */
export const HL_START = "\u0002";
export const HL_STOP = "\u0003";

export type HlPart = { text: string; hit: boolean };

export function splitHighlight(text: string): HlPart[] {
  const parts: HlPart[] = [];
  let rest = text;
  while (rest) {
    const a = rest.indexOf(HL_START);
    if (a < 0) {
      parts.push({ text: rest, hit: false });
      break;
    }
    if (a > 0) parts.push({ text: rest.slice(0, a), hit: false });
    const z = rest.indexOf(HL_STOP, a + 1);
    const end = z < 0 ? rest.length : z;
    parts.push({ text: rest.slice(a + 1, end), hit: true });
    rest = z < 0 ? "" : rest.slice(z + 1);
  }
  return parts;
}
