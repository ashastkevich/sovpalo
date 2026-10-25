"use client";

import { useEffect, useRef } from "react";

/**
 * Улучшение поверх обычной формы: с JS фильтр применяется сразу при выборе чипа, без кнопки «Показать».
 * Без JS форма работает как есть, через кнопку.
 */
export function AutoSubmit() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    form.setAttribute("data-autosubmit", "");
    const onChange = (e: Event) => {
      if ((e.target as HTMLInputElement).type !== "search") form.requestSubmit();
    };
    // Пустые поля не попадают в адрес: «?tema=yumor» вместо «?q=&tema=yumor&cena=»
    const onFormData = (e: FormDataEvent) => {
      for (const [k, v] of [...e.formData.entries()]) if (v === "" && e.formData.getAll(k).every((x) => x === "")) e.formData.delete(k);
    };
    form.addEventListener("change", onChange);
    form.addEventListener("formdata", onFormData);
    return () => {
      form.removeEventListener("change", onChange);
      form.removeEventListener("formdata", onFormData);
    };
  }, []);
  return <span ref={ref} hidden />;
}
