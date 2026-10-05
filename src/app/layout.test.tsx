import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getSiteOrigin } from "@/features/seo/metadata";
import RootLayout, { metadata } from "./layout";

describe("root SEO metadata", () => {
  it("uses the configured site origin as metadata base", () => {
    expect(new URL(String(metadata.metadataBase)).origin).toBe(getSiteOrigin());
  });

  it("publishes truthful WebSite structured data", () => {
    const markup = renderToStaticMarkup(RootLayout({ children: <main>content</main> }));

    expect(markup).toContain('type="application/ld+json"');
    expect(markup).toContain('"@type":"WebSite"');
    expect(markup).toContain(`"url":"${getSiteOrigin()}/"`);
  });
});
