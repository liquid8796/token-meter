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
});
