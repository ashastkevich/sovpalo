/** Защита счётчика переходов от ботов и предзагрузки (ADR-0001, раздел 5) */

const BOT_UA = /bot|crawl|spider|slurp|preview|fetch|curl|wget|python|httpclient|headless|monitor/i;

/**
 * Считаем только живые переходы: GET с Referer нашего домена и без бот-User-Agent.
 * Сам User-Agent не сохраняется.
 */
export function isCountable(headers: Headers, siteHost: string): boolean {
  const ua = headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return false;
  if (headers.get("purpose") === "prefetch" || headers.get("sec-purpose")?.includes("prefetch")) return false;
  const referer = headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).host === siteHost;
  } catch {
    return false;
  }
}
