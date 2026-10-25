/**
 * Формат файла импорта брендов (ADR-0001, раздел 3), schema_version 1.0 — выгрузка базы «Бренды».
 * Из этой же схемы генерируется schemas/brands.schema.json (`pnpm schema:brands`).
 */
import { z } from "zod";

const text = z.string().trim().min(1);
const nullableText = text.nullable();
const url = z.url({ protocol: /^https?$/ });
const nullableUrl = url.nullable();
const list = z.array(text).default([]);
const isoDate = z.iso.date();

export const brandSchema = z.strictObject({
  id: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "латиница в нижнем регистре, цифры и дефисы: это адрес /brands/<id>/"),
  name: text,
  city: nullableText,
  /** Нет в выгрузке 1.0: по умолчанию бренд на витрине */
  status: z.enum(["showcase", "hold", "reserve"]).optional(),
  /** Акцентный цвет страницы бренда (FR-20); в выгрузке 1.0 нет */
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "цвет в формате #RRGGBB")
    .nullable()
    .optional(),
  taste: z.strictObject({
    styles: list,
    themes: list,
    decor: list,
  }),
  originality: z.strictObject({
    kind: z.enum(["original", "original_licensed", "licensed"]).nullable(),
    license_confirmed: z.boolean(),
    license_holder: nullableText,
  }),
  maker: z.strictObject({
    type: nullableText,
    made_in: nullableText,
    run: nullableText,
    print: list,
    values: list,
  }),
  price: z
    .strictObject({
      from: z.int().positive().nullable(),
      to: z.int().positive().nullable(),
    })
    .refine((p) => p.from == null || p.to == null || p.to >= p.from, {
      message: "цена «до» меньше цены «от»",
      path: ["to"],
    }),
  fit: z.strictObject({
    cut: list,
    text: nullableText,
    sizes: nullableText,
    neck: nullableText,
  }),
  fabric: z.strictObject({
    gsm: z.int().min(50).max(600).nullable(),
    gsm_to: z.int().min(50).max(600).nullable(),
    composition: nullableText,
    cotton100: z.boolean().nullable(),
  }),
  texts: z.strictObject({
    description: nullableText,
    story: nullableText,
  }),
  buy: z.strictObject({
    site: nullableUrl,
    wildberries: nullableUrl,
    ozon: nullableUrl,
    yandex_market: nullableUrl,
    lamoda: nullableUrl,
    telegram: nullableUrl,
    vk: nullableUrl,
    multibrand: z.strictObject({ name: text, url }).nullable(),
    /** Текст про офлайн-точки или true, если известно только, что они есть */
    offline: z.union([text, z.literal(true)]).nullable(),
    sells_in_social: z.boolean(),
  }),
  data: z.strictObject({
    source: text,
    checked: isoDate.nullable(),
    notion_id: nullableText,
  }),
});

export const brandsFileSchema = z
  .strictObject({
    /** Ссылка на JSON Schema для подсказок в редакторе */
    $schema: z.string().optional(),
    schema_version: z.literal("1.0"),
    exported_at: z.iso.datetime().optional(),
    source: z.string().optional(),
    brands: z.array(brandSchema),
  })
  .superRefine((file, ctx) => {
    const seen = new Map<string, number>();
    file.brands.forEach((b, i) => {
      const first = seen.get(b.id);
      if (first !== undefined) {
        ctx.addIssue({ code: "custom", path: ["brands", i, "id"], message: `id повторяется, первый раз — brands[${first}]` });
      } else seen.set(b.id, i);
    });
  });

export type BrandInput = z.infer<typeof brandSchema>;
export type BrandsFile = z.infer<typeof brandsFileSchema>;

export type ValidationError = { brand: string | null; field: string; message: string };

/** Ошибки с id бренда и полем, как требует ADR: «brand abc-clothes, buy.site: …» */
export function describeIssues(raw: unknown, error: z.ZodError): ValidationError[] {
  const list = (raw as { brands?: unknown[] } | null)?.brands;
  return error.issues.map((issue) => {
    const path = [...issue.path];
    let brand: string | null = null;
    if (path[0] === "brands" && typeof path[1] === "number") {
      const item = Array.isArray(list) ? (list[path[1]] as { id?: unknown } | undefined) : undefined;
      brand = typeof item?.id === "string" ? item.id : `brands[${path[1]}]`;
      path.splice(0, 2);
    }
    return { brand, field: path.join(".") || "(файл)", message: issue.message };
  });
}
