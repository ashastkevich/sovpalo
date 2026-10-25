import { NextResponse } from "next/server";

/**
 * До открытия каталога (SITE_INDEXING=false) каждая страница отдаётся с X-Robots-Tag: noindex (NFR-7).
 * Заголовок ставится при запросе, поэтому один и тот же образ работает и на staging, и на prod.
 */
export function proxy() {
  const res = NextResponse.next();
  if (process.env.SITE_INDEXING !== "true") res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
