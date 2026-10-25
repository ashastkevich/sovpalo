import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  /** Адреса со слешем на конце: /brands/<id>/ (FR-19) */
  trailingSlash: true,
  poweredByHeader: false,
};

export default nextConfig;
