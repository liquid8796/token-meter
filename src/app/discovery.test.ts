import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("SEO discovery routes", () => {
  it("sitemaps only durable indexable routes with no query variants", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => new URL(entry.url));
    const paths = urls.map((url) => url.pathname);

    expect(paths).toEqual(expect.arrayContaining([
      "/",
      "/models",
      "/models/gpt-6.1-sol",
      "/providers/openai",
      "/compare",
      "/budget",
      "/changes",
      "/about",
      "/privacy",
    ]));
    expect(urls.every((url) => url.search === "" && url.hash === "")).toBe(true);
    expect(new Set(urls.map((url) => url.href)).size).toBe(urls.length);
  });

  it("allows public crawling and advertises the canonical sitemap", () => {
    const result = robots();

    expect(result.rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect(String(result.sitemap)).toMatch(/\/sitemap\.xml$/);
  });
});
