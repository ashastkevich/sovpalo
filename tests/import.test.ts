import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { recordHash, toBrandRecord, validateBrandsFile } from "@/import/import-brands";
import { brandSchema } from "@/import/schema";

const sample = () => JSON.parse(readFileSync("data/brands.sample.json", "utf8"));

describe("проверка файла импорта", () => {
  it("пример из репозитория проходит схему", () => {
    const v = validateBrandsFile(sample());
    expect(v.ok).toBe(true);
  });

  it("ошибка называет бренд и поле", () => {
    const file = sample();
    file.brands[1].buy.site = "не ссылка";
    file.brands[2].price = { from: 3000, to: 1000 };
    const v = validateBrandsFile(file);
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ brand: "primer-sever", field: "buy.site" }),
        expect.objectContaining({ brand: "primer-retro", field: "price.to" }),
      ]),
    );
  });

  it("повтор id — ошибка", () => {
    const file = sample();
    file.brands.push({ ...file.brands[0] });
    const v = validateBrandsFile(file);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors[0]).toMatchObject({ brand: "primer-kotiki", field: "id" });
  });

  it("лишнее поле — ошибка, а не молчаливый пропуск", () => {
    const file = sample();
    file.brands[0].taste.colour = "red";
    expect(validateBrandsFile(file).ok).toBe(false);
  });

  it("id должен годиться для адреса /brands/<id>/", () => {
    const b = { ...sample().brands[0], id: "Котики" };
    expect(brandSchema.safeParse(b).success).toBe(false);
  });
});

describe("JSON → запись сервиса", () => {
  it("магазины, офлайн и статус по умолчанию", () => {
    const [kotiki, sever, retro] = sample().brands.map((b: unknown) => toBrandRecord(brandSchema.parse(b)));
    expect(kotiki.status).toBe("showcase");
    expect(kotiki.shops.map((s: { kind: string }) => s.kind)).toEqual(["site", "ozon", "telegram"]);
    expect(sever.shops.at(-1)).toMatchObject({ kind: "multibrand", name: "Пример-маркет" });
    expect(sever).toMatchObject({ hasOffline: true, offlineText: "Архангельск, набережная, 1" });
    expect(retro).toMatchObject({ hasOffline: true, offlineText: null, originality: null });
  });

  it("хеш не меняется для тех же данных и меняется при правке", () => {
    const b = brandSchema.parse(sample().brands[0]);
    expect(recordHash(toBrandRecord(b))).toBe(recordHash(toBrandRecord(brandSchema.parse(sample().brands[0]))));
    expect(recordHash(toBrandRecord({ ...b, name: "Другое" }))).not.toBe(recordHash(toBrandRecord(b)));
  });
});
