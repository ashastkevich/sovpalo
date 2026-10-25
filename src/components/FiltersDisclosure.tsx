"use client";

import { type ReactNode, useEffect, useRef } from "react";

const DESKTOP = "(min-width: 861px)";

// Панель пересоздаётся после каждого применённого фильтра (key в FilterPanel), а раскрытие должно сохраниться
let openOnMobile = false;

/**
 * На телефоне фильтры свёрнуты под кнопку «Фильтры», чтобы выдача начиналась на первом экране.
 * На широком экране раскрыты всегда: в CSS через ::details-content, в старых браузерах — отсюда.
 */
export function FiltersDisclosure({ active, children }: { active: number; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const mq = window.matchMedia(DESKTOP);
    const sync = () => {
      d.open = mq.matches || openOnMobile;
    };
    const onToggle = () => {
      if (!mq.matches) openOnMobile = d.open;
    };
    sync();
    mq.addEventListener("change", sync);
    d.addEventListener("toggle", onToggle);
    return () => {
      mq.removeEventListener("change", sync);
      d.removeEventListener("toggle", onToggle);
    };
  }, []);
  return (
    <details ref={ref} className="more">
      <summary className="btn">
        Фильтры
        {active > 0 && <span className="more-n">{active}</span>}
      </summary>
      <div className="more-body">{children}</div>
    </details>
  );
}
