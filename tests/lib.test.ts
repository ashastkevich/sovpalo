import { describe, expect, it } from "vitest";
import { parseFilters, withCampaign } from "@/lib/filters";
import { priceText, brandsCount } from "@/lib/format";
import { goHref, withUtm } from "@/lib/links";
import { HL_START, HL_STOP, splitHighlight, toTsQuery } from "@/lib/search";
import { slugify } from "@/lib/taxonomy";
import { isCountable } from "@/lib/click-guard";

describe("поиск", () => {
  it("убирает служебные слова и ищет по началу слова", () => {
    expect(toTsQuery("футболка с котами про космос")).toBe("котами:* & космос:*");
    expect(toTsQuery("где и как")).toBeNull();
    expect(toTsQuery("'; drop table brands; --")).toBe("drop:* & table:* & brands:*");
  });

  it("разбирает отметки ts_headline", () => {
    expect(splitHighlight(`Футболки с ${HL_START}котами${HL_STOP} и чайками`)).toEqual([
      { text: "Футболки с ", hit: false },
      { text: "котами", hit: true },
      { text: " и чайками", hit: false },
    ]);
  });
});

describe("фильтры из адреса", () => {
  it("берёт только известные значения", () => {
    const f = parseFilters({ tema: ["yumor", "retro"], posadka: "free,huge", cena: "3000", kupit: ["ozon", "mars"], tkan: "dense" });
    expect(f).toMatchObject({ themes: ["yumor", "retro"], fits: ["free"], price: 3000, buy: ["ozon"], fabric: ["dense"] });
    expect(parseFilters({ cena: "2500" }).price).toBe(0);
    expect(parseFilters({ tema: "<script>" }).themes).toEqual([]);
  });

  it("метка кампании передаётся по внутренним ссылкам", () => {
    expect(withCampaign("/brands/x/", "dir1")).toBe("/brands/x/?c=dir1");
    expect(withCampaign("/?p=abc", null)).toBe("/?p=abc");
  });
});

describe("ссылки в магазины", () => {
  it("UTM для сайтов и площадок, без меток для Telegram и VK", () => {
    expect(withUtm("https://shop.ru/a?x=1", "site", "brand", null)).toBe(
      "https://shop.ru/a?x=1&utm_source=sovpalo&utm_medium=catalog&utm_campaign=catalog&utm_content=brand",
    );
    expect(withUtm("https://t.me/brand", "telegram", "brand", "dir1")).toBe("https://t.me/brand");
  });

  it("кнопка ведёт на /go/ со слешем", () => {
    expect(goHref("sever", "ozon", "card", "dir1")).toBe("/go/sever/ozon/?from=card&c=dir1");
  });

  it("счётчик не считает ботов и переходы без нашего Referer", () => {
    const h = (o: Record<string, string>) => new Headers(o);
    const ua = "Mozilla/5.0 (Macintosh) Safari/605";
    expect(isCountable(h({ "user-agent": ua, referer: "https://sovpalo.net/brands/x/" }), "sovpalo.net")).toBe(true);
    expect(isCountable(h({ "user-agent": "YandexBot/3.0", referer: "https://sovpalo.net/" }), "sovpalo.net")).toBe(false);
    expect(isCountable(h({ "user-agent": ua }), "sovpalo.net")).toBe(false);
    expect(isCountable(h({ "user-agent": ua, referer: "https://evil.ru/" }), "sovpalo.net")).toBe(false);
  });
});

describe("форматирование", () => {
  it("цена и число брендов", () => {
    // Разделитель разрядов в ru-RU — узкий неразрывный пробел
    expect(priceText(2490, 3290)?.replace(/\s/gu, " ")).toBe("2 490–3 290 ₽");
    expect(priceText(null, 100)).toBeNull();
    expect(brandsCount(1)).toBe("1 бренд");
    expect(brandsCount(64)).toBe("64 бренда");
    expect(brandsCount(15)).toBe("15 брендов");
  });

  it("slug из русского названия", () => {
    expect(slugify("Ретро")).toBe("retro");
    expect(slugify("Город и местная идентичность")).toBe("gorod-i-mestnaya-identichnost");
  });
});
