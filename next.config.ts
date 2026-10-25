import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  /** Адреса со слешем на конце: /brands/<id>/ (FR-19) */
  trailingSlash: true,
  poweredByHeader: false,
  /** Сборка для Docker-образа: сервер и только нужные зависимости (ADR-0001, раздел 8) */
  output: "standalone",
};

export default nextConfig;
