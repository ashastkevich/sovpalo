import Form from "next/form";
import Link from "next/link";
import { PARAM, hasFilters, withCampaign } from "@/lib/filters";
import { rub } from "@/lib/format";
import { BUDGETS, BUY_FILTER_LABEL, FIT_LABEL } from "@/lib/taxonomy";
import type { CatalogFacets, CatalogFilters } from "@/server/services/brands";
import { AutoSubmit } from "./AutoSubmit";

function Chip(props: { name: string; value: string; label: string; count?: number; swatch?: string | null; checked: boolean; radio?: boolean }) {
  const { name, value, label, count, swatch, checked, radio } = props;
  return (
    <label className="chip">
      <input type={radio ? "radio" : "checkbox"} name={name} value={value} defaultChecked={checked} />
      {swatch && <span className="sw" style={{ ["--c" as string]: swatch }} />}
      {label}
      {count != null && <span className="n">{count}</span>}
    </label>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Фильтры в левой колонке, как в прототипе (FR-4, FR-5). Обычная форма GET:
 * параметры попадают в адрес, страница собирается на сервере.
 */
export function FilterPanel(props: { action: string; facets: CatalogFacets; filters: CatalogFilters; seed: string; campaign: string | null }) {
  const { action, facets, filters: f, seed, campaign } = props;
  return (
    <Form action={action} className="panel" aria-label="Фильтры" scroll={false}>
      <AutoSubmit />
      <input type="hidden" name={PARAM.seed} value={seed} />
      {campaign && <input type="hidden" name={PARAM.campaign} value={campaign} />}
      <div className="group">
        <label className="label" htmlFor="f-q">
          Поиск
        </label>
        <input
          id="f-q"
          className="search"
          type="search"
          name={PARAM.q}
          defaultValue={f.q}
          placeholder="Бренд или слово: коты, космос, оверсайз"
          autoComplete="off"
          maxLength={100}
        />
      </div>
      <fieldset className="group" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label">Темы принтов</legend>
        <div className="chips">
          {facets.themes.map((t) => (
            <Chip key={t.slug} name={PARAM.themes} value={t.slug} label={t.shortName ?? t.name} count={t.count} swatch={t.color} checked={f.themes.includes(t.slug)} />
          ))}
        </div>
      </fieldset>
      <fieldset className="group" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label">Стиль</legend>
        <div className="chips">
          {facets.styles.map((t) => (
            <Chip key={t.slug} name={PARAM.styles} value={t.slug} label={t.shortName ?? t.name} count={t.count} swatch={t.color} checked={f.styles.includes(t.slug)} />
          ))}
        </div>
      </fieldset>
      {facets.fits.length > 0 && (
        <fieldset className="group" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label">Посадка</legend>
          <div className="chips">
            {facets.fits.map((x) => (
              <Chip key={x.kind} name={PARAM.fits} value={x.kind} label={cap(FIT_LABEL[x.kind])} count={x.count} checked={f.fits.includes(x.kind)} />
            ))}
          </div>
        </fieldset>
      )}
      <fieldset className="group" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label">Ткань</legend>
        <div className="chips">
          <Chip name={PARAM.fabric} value="dense" label="От 200 г/м²" count={facets.dense} checked={f.fabric.includes("dense")} />
          <Chip name={PARAM.fabric} value="cotton" label="100% хлопок" count={facets.cotton} checked={f.fabric.includes("cotton")} />
        </div>
        <p className="hint">Бренды без данных о ткани и посадке скрываются, когда выбран фильтр.</p>
      </fieldset>
      <fieldset className="group" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label">Цена футболки</legend>
        <div className="chips">
          {BUDGETS.map((v) => (
            <Chip key={v} radio name={PARAM.price} value={String(v)} label={`До ${rub(v)} ₽`} checked={f.price === v} />
          ))}
          <Chip radio name={PARAM.price} value="" label="Любая" checked={f.price === 0} />
        </div>
      </fieldset>
      <fieldset className="group" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label">Где купить</legend>
        <div className="chips">
          {facets.buy.map((x) => (
            <Chip key={x.kind} name={PARAM.buy} value={x.kind} label={BUY_FILTER_LABEL[x.kind]} count={x.count} checked={f.buy.includes(x.kind)} />
          ))}
        </div>
      </fieldset>
      <div className="panel-actions">
        <button type="submit" className="btn primary sm apply">
          Показать
        </button>
        {hasFilters(f) && (
          <Link className="linkbtn" href={withCampaign(`${action}?${PARAM.seed}=${seed}`, campaign)} scroll={false}>
            Сбросить фильтры
          </Link>
        )}
      </div>
    </Form>
  );
}
