import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://givehand.et";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/needs", "/organizations", "/verify"],
        disallow: [
          "/admin",
          "/dashboard",
          "/org",
          "/onboarding",
          "/api",
          "/_next",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
