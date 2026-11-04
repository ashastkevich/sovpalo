"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Choice = "accepted" | "declined";

const KEY = "cookie-consent";
/** Кнопка «Настройки cookie» в футере снова открывает баннер */
const OPEN_EVENT = "cookie-settings";

declare global {
  interface Window {
    ym?: ((id: number, method: string, ...args: unknown[]) => void) & { a?: unknown[]; l?: number };
  }
}

function readChoice(): Choice | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

function saveChoice(v: Choice) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    // Без localStorage баннер просто покажется снова при следующем заходе
  }
}

/** Код счётчика Метрики; Вебвизор (запись сессий) выключен (NFR-5). Хиты отправляем сами: адрес меняется без перезагрузки */
function loadMetrika(id: number) {
  if (window.ym) return;
  const ym: NonNullable<Window["ym"]> = (...args) => {
    (ym.a ??= []).push(args);
  };
  ym.l = Date.now();
  window.ym = ym;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(s);
  ym(id, "init", { defer: true, clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
}

/** При отказе после согласия стираем cookie Метрики и перезагружаем страницу, чтобы счётчик выгрузился */
function dropMetrikaCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (name.startsWith("_ym")) {
      for (const domain of ["", `; domain=.${location.hostname}`]) document.cookie = `${name}=; max-age=0; path=/${domain}`;
    }
  }
}

/**
 * Баннер cookie и Яндекс Метрика (FR-29, NFR-5): счётчик грузится только после «Принять».
 * Кнопки «Принять» и «Отказаться» одного вида. Выбор хранится в localStorage этого браузера.
 */
export function CookieConsent({ counterId, policyUrl }: { counterId: number; policyUrl: string | null }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    const saved = readChoice();
    // Выбор читается после гидрации: на сервере localStorage нет
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(saved);
    setOpen(saved === null);
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (choice !== "accepted") return;
    loadMetrika(counterId);
    window.ym?.(counterId, "hit", location.href, { title: document.title, referer: document.referrer });
  }, [choice, counterId, pathname, search]);

  const decide = (v: Choice) => {
    const wasAccepted = choice === "accepted";
    saveChoice(v);
    setChoice(v);
    setOpen(false);
    if (v === "declined" && wasAccepted) {
      dropMetrikaCookies();
      location.reload();
    }
  };

  if (!open) return null;
  return (
    <div className="cookie" role="dialog" aria-label="Cookie">
      <div className="wrap">
        <p>
          Мы хотим считать посещения через Яндекс Метрику: она ставит cookie. Без вашего согласия счётчик не включится, каталог работает
          так же.{" "}
          {policyUrl && (
            <a href={policyUrl} target="_blank" rel="noopener">
              Политика обработки данных
            </a>
          )}
        </p>
        <div className="row">
          <button type="button" className="btn sm" onClick={() => decide("accepted")}>
            Принять
          </button>
          <button type="button" className="btn sm" onClick={() => decide("declined")}>
            Отказаться
          </button>
        </div>
      </div>
    </div>
  );
}

/** «Настройки cookie» в футере (NFR-5) */
export function CookieSettingsButton() {
  return (
    <button type="button" className="linkbtn" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      Настройки cookie
    </button>
  );
}
