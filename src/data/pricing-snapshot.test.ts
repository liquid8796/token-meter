import { describe, expect, it } from "vitest";

import { PRICING_SNAPSHOT } from "./pricing-snapshot";

const OFFICIAL_SOURCE_HOSTS = new Set([
  "developers.openai.com",
  "platform.claude.com",
  "ai.google.dev",
]);

describe("PRICING_SNAPSHOT", () => {
  it("ships every pricing record with a verified official HTTPS source", () => {
    for (const pricing of PRICING_SNAPSHOT.pricing) {
      const source = new URL(pricing.sourceUrl);

      expect(source.protocol).toBe("https:");
      expect(OFFICIAL_SOURCE_HOSTS.has(source.hostname)).toBe(true);
      expect(pricing.verifiedAt).toMatch(/^2026-10-05T/);
      expect(pricing.effectiveFromBasis).toBe(
        pricing.id === "price-gemini-3-8-flash-2027" ? "official" : "verified",
      );
    }
  });

  it("has a provider and at least one price for every shipped model", () => {
    const providerIds = new Set(PRICING_SNAPSHOT.providers.map((provider) => provider.id));
    const pricedModelIds = new Set(PRICING_SNAPSHOT.pricing.map((pricing) => pricing.modelId));

    for (const model of PRICING_SNAPSHOT.models) {
      expect(providerIds.has(model.providerId)).toBe(true);
      expect(pricedModelIds.has(model.id)).toBe(true);
    }
  });

  it("does not silently overlap pricing bands inside a record", () => {
    for (const pricing of PRICING_SNAPSHOT.pricing) {
      const bands = [...pricing.bands].sort((a, b) =>
        a.minInputTokensPerRequest < b.minInputTokensPerRequest ? -1 : 1,
      );

      for (let index = 1; index < bands.length; index += 1) {
        const previous = bands[index - 1];
        const current = bands[index];

        expect(previous.maxInputTokensPerRequest).not.toBeNull();
        expect(current.minInputTokensPerRequest).toBe(
          previous.maxInputTokensPerRequest! + 1n,
        );
      }
    }
  });
  it("stores only first-party verified batch dimensions", () => {
    const current = new Map(
      PRICING_SNAPSHOT.pricing
        .filter((pricing) => pricing.effectiveFrom <= "2026-10-05T23:59:59.999Z")
        .map((pricing) => [pricing.modelId, pricing]),
    );

    expect(current.get("model-gpt-6-astra")?.bands.map((band) => [band.batchInputPerUnit, band.batchOutputPerUnit])).toEqual([
      ["5", "25"],
      ["10", "37.5"],
    ]);
    expect(current.get("model-gpt-6-1-sol")?.bands.map((band) => [band.batchInputPerUnit, band.batchOutputPerUnit])).toEqual([
      ["1", "5"],
      ["2", "7.5"],
    ]);
    expect(current.get("model-gpt-6-luna")?.bands.map((band) => [band.batchInputPerUnit, band.batchOutputPerUnit])).toEqual([
      ["0.05", "0.25"],
      ["0.1", "0.375"],
    ]);
    expect(current.get("model-claude-fable-5-1")?.bands[0]).toMatchObject({ batchInputPerUnit: "5", batchOutputPerUnit: "25" });
    expect(current.get("model-claude-opus-5-5")?.bands[0]).toMatchObject({ batchInputPerUnit: "2", batchOutputPerUnit: "10" });
    expect(current.get("model-claude-sonnet-5-5")?.bands[0]).toMatchObject({ batchInputPerUnit: "1", batchOutputPerUnit: "5" });

    for (const pricing of PRICING_SNAPSHOT.pricing.filter((item) => item.modelId.startsWith("model-gemini"))) {
      for (const band of pricing.bands) {
        expect(band.batchInputPerUnit).toBeUndefined();
        expect(band.batchOutputPerUnit).toBeUndefined();
      }
    }
  });
});
