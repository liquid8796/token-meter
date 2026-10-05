import { describe, expect, it } from "vitest";

import { PRICING_SNAPSHOT } from "@/data/pricing-snapshot";
import { buildSeedRows } from "./seed-rows";

describe("buildSeedRows", () => {
  it("flattens the verified snapshot into normalized database rows", () => {
    const rows = buildSeedRows(PRICING_SNAPSHOT);

    expect(rows.providers).toHaveLength(3);
    expect(rows.models).toHaveLength(8);
    expect(rows.pricing).toHaveLength(9);
    expect(rows.bands).toHaveLength(13);
    expect(rows.pricing.find((pricing) => pricing.id === "price-gemini-3-8-flash-2027")?.effectiveFromBasis).toBe("official");
    expect(rows.pricing.find((pricing) => pricing.id === "price-gpt-6-1-sol-2026-10-05")?.effectiveFromBasis).toBe("verified");
  });

  it("preserves bigint thresholds and decimal rates without floating point conversion", () => {
    const rows = buildSeedRows(PRICING_SNAPSHOT);
    const longSolBand = rows.bands.find(
      (band) =>
        band.pricingId === "price-gpt-6-1-sol-2026-10-05" &&
        band.minInputTokensPerRequest === "272001",
    );

    expect(longSolBand).toMatchObject({
      unitTokens: "1000000",
      minInputTokensPerRequest: "272001",
      maxInputTokensPerRequest: null,
      inputPerUnit: "4",
      cachedInputPerUnit: "0.2",
      outputPerUnit: "15",
    });
  });
});
