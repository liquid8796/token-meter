import { describe, expect, it } from "vitest";

import { loadProviderDetail } from "./load-provider-detail";

describe("loadProviderDetail", () => {
  it("returns only active and preview provider models with current pricing", async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      const detail = await loadProviderDetail(
        "google",
        new Date("2026-10-05T12:00:00.000Z"),
      );

      expect(detail?.provider.name).toBe("Google");
      expect(detail?.models.map(({ model }) => [model.slug, model.status])).toEqual([
        ["gemini-3.1-pro-preview", "preview"],
        ["gemini-3.8-flash", "active"],
      ]);
      expect(detail?.models.every(({ pricing }) => pricing !== null)).toBe(true);
      expect(detail?.historyStatus).toBe("unavailable");
      expect(detail?.recentChanges).toEqual([]);
    } finally {
      if (original) process.env.DATABASE_URL = original;
    }
  });

  it("returns null for an unknown provider slug", async () => {
    await expect(loadProviderDetail("missing-provider")).resolves.toBeNull();
  });
});