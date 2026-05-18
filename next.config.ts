import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const isStaticExport =
  process.env.STATIC_EXPORT === "1" ||
  process.env.STATIC_EXPORT === "true";

const rawBase = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim();
const basePath =
  rawBase === "" || rawBase === "/"
    ? undefined
    : rawBase.replace(/\/$/, "");

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  ...(isStaticExport
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default withNextIntl(nextConfig);
