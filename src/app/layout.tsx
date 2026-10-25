import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PreviewStrip } from "@/components/PreviewStrip";
import "./globals.css";

export const metadata: Metadata = {
  // Для относительных canonical и Open Graph на статических страницах; значение берётся при сборке
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: { default: "Совпало — независимые бренды футболок", template: "%s · Совпало" },
  description: "Каталог российских брендов футболок с авторским дизайном. Все бренды на одних условиях, порядок случайный, место купить нельзя.",
  applicationName: "Совпало",
  openGraph: { siteName: "Совпало", locale: "ru_RU", type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
};

function Logo() {
  return (
    <Link className="logo" href="/" aria-label="Совпало, на главную">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <circle cx="13" cy="13" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M13 1v24M1 13h24" stroke="currentColor" strokeWidth="2" />
        <circle cx="13" cy="13" r="2.5" fill="currentColor" />
      </svg>
      <b>Совпало</b>
    </Link>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <Suspense fallback={null}>
          <PreviewStrip />
        </Suspense>
        <header className="top">
          <div className="wrap">
            <Logo />
            <nav className="nav" aria-label="Разделы">
              <Link href="/">Все бренды</Link>
              <Link href="/dlya-brendov/">Для брендов</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="foot">
          <div className="wrap">
            <span>Совпало · данные из открытых источников, дата проверки — на странице бренда</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
