import { describe, expect, it } from "vitest";

import { loadModelDetail } from "./load-model-detail";

describe("loadModelDetail", () => {
  it("loads source-backed current pricing even when history is unavailable", async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      const detail = await loadModelDetail(
        "gpt-6.1-sol",
        new Date("2026-10-05T12:00:00.000Z"),
      );

      expect(detail?.model.name).toBe("GPT-6.1 Sol");
      expect(detail?.provider.slug).toBe("openai");
      expect(detail?.pricing.bands[0].inputPerUnit).toBe("2");
      expect(detail?.history).toEqual({ status: "unavailable", records: [], changes: [] });
      expect(detail?.relatedModels.map((model) => model.slug)).toEqual([
        "gpt-6-astra",
        "gpt-6-luna",
      ]);
    } finally {
      if (original) process.env.DATABASE_URL = original;
    }
  });

  it("returns null for an unknown model slug", async () => {
    await expect(loadModelDetail("missing-model")).resolves.toBeNull();
  });
});