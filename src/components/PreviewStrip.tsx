import { connection } from "next/server";
import { env } from "@/lib/env";

/** Полоса «Предпросмотр каталога», пока каталог не открыт покупателям (FR-9). Этап берётся из окружения при запросе */
export async function PreviewStrip() {
  await connection();
  if (env().SITE_STAGE !== "preview") return null;
  return (
    <div className="strip">
      <div className="wrap">
        <span>Предпросмотр каталога</span>
        <span className="grow">Покупателям каталог пока не открыт. Страницы брендов собраны из открытых источников, бренды их ещё не проверяли.</span>
      </div>
    </div>
  );
}
