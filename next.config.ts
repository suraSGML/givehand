import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // ── Tailwind CSS v4 with Turbopack ─────────────────────────────────────
  // @tailwindcss/turbopack is required to process `@import "tailwindcss"`
  // and generate utility classes when Turbopack is the bundler (Next.js 16+).
  // Without this, Tailwind classes are never emitted and the page renders as
  // plain unstyled HTML.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  experimental: {},
};

export default withNextIntl(nextConfig);
