import type { MetadataRoute } from "next";

import { getSiteOrigin, siteUrl } from "@/features/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: getSiteOrigin(),
  };
}
