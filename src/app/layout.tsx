import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { Analytics, CookieSettings } from "@/components/Analytics";
import { PreviewStrip } from "@/components/PreviewStrip";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
});

export const metadata: Metadata = {
  // Для относительных canonical и Open Graph на статических страницах; значение берётся при сборке
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: { default: "Совпало — независимые бренды футболок", template: "%s · Совпало" },
  description: "Каталог российских брендов футболок с авторским дизайном. Все бренды на одних условиях, порядок случайный, место купить нельзя.",
  applicationName: "Совпало",
  icons: { icon: "/favicon.ico" },
  openGraph: { siteName: "Совпало", locale: "ru_RU", type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

function Logo() {
  return (
    <Link className="logo" href="/" aria-label="Совпало, на главную">
      {/* Локальный SVG: векторному логотипу оптимизация растровых изображений не нужна */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="Совпало" width="1286" height="246" />
    </Link>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${manrope.variable} ${unbounded.variable}`}>
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
            <div className="foot-brand" aria-label="Совпало">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-dark.svg" alt="" width="1286" height="246" />
            </div>
            <span>Совпало · данные из открытых источников, дата проверки — на странице бренда</span>
            <Suspense fallback={null}>
              <CookieSettings />
            </Suspense>
          </div>
        </footer>
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
