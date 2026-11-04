import { connection } from "next/server";
import { env } from "@/lib/env";
import { CookieConsent, CookieSettingsButton } from "./CookieConsent";

/** Метрика работает, если задан номер счётчика, и в предпросмотре тоже (решение 25.10.2026, меняет NFR-4) */
async function metrika() {
  await connection();
  const { METRIKA_ID, POLICY_URL } = env();
  return METRIKA_ID ? { counterId: METRIKA_ID, policyUrl: POLICY_URL ?? null } : null;
}

export async function Analytics() {
  const m = await metrika();
  return m && <CookieConsent {...m} />;
}

export async function CookieSettings() {
  return (await metrika()) && <CookieSettingsButton />;
}
