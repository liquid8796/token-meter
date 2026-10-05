import { afterEach, describe, expect, it } from "vitest";

import { createCanonicalMetadata, getSiteOrigin, siteUrl } from "./metadata";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe("SEO metadata helpers", () => {
  it("uses the configured public origin and normalizes trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://tokenmeter.site/";

    expect(getSiteOrigin()).toBe("https://tokenmeter.site");
    expect(siteUrl("/models/gpt-6.1-sol")).toBe("https://tokenmeter.site/models/gpt-6.1-sol");
  });

  it("canonicalizes query-string variants to the durable route", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://tokenmeter.site";

    const metadata = createCanonicalMetadata({
      title: "Compare AI model costs",
      description: "Compare models.",
      path: "/compare?models=gpt-6.1-sol&input=2M#results",
    });

    expect(metadata.alternates).toEqual({ canonical: "https://tokenmeter.site/compare" });
  });

  it("falls back to a safe local origin when the configured value is invalid", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not a url";

    expect(getSiteOrigin()).toBe("http://localhost:3000");
  });
});
