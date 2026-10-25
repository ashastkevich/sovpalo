import { ORIGINALITY_LABEL } from "@/lib/taxonomy";
import type { Originality } from "@/server/services/brands";

const CLS: Record<Originality, string> = { original: "o-own", original_licensed: "o-mix", licensed: "o-lic" };

/** Метка «Авторский дизайн» / «Лицензия»; лицензионные — только после подтверждения в оферте (FR-12) */
export function originalityShown(kind: Originality | null, licenseConfirmed: boolean): Originality | null {
  if (!kind) return null;
  if (kind !== "original" && !licenseConfirmed) return null;
  return kind;
}

export function Badge({ kind, licenseConfirmed }: { kind: Originality | null; licenseConfirmed: boolean }) {
  const shown = originalityShown(kind, licenseConfirmed);
  return shown ? <span className={`badge ${CLS[shown]}`}>{ORIGINALITY_LABEL[shown]}</span> : null;
}
