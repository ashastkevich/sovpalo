export const rub = (n: number) => n.toLocaleString("ru-RU");

export function priceText(from: number | null, to: number | null): string | null {
  if (from == null) return null;
  if (to == null) return `от ${rub(from)} ₽`;
  if (to === from) return `${rub(from)} ₽`;
  return `${rub(from)}–${rub(to)} ₽`;
}

export function plural(n: number, forms: [string, string, string]): string {
  const a = n % 10;
  const b = n % 100;
  return forms[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 1 : 2];
}

export const brandsCount = (n: number) => `${n} ${plural(n, ["бренд", "бренда", "брендов"])}`;

export const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function gsmText(gsm: number | null, gsmTo: number | null): string | null {
  if (gsm == null) return null;
  return gsmTo != null && gsmTo !== gsm ? `${gsm}–${gsmTo} г/м²` : `${gsm} г/м²`;
}

export function fabricText(composition: string | null, gsm: number | null, gsmTo: number | null): string {
  return [composition, gsmText(gsm, gsmTo)].filter(Boolean).join(", ");
}

/** 2026-10-19 → 19.10.2026 */
export function ruDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
