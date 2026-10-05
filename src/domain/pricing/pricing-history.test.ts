import { describe, expect, it } from "vitest";

import type { ModelPricing, PricingBand } from "./types";
import { derivePricingChanges } from "./pricing-history";

function band(overrides: Partial<PricingBand> = {}): PricingBand {
  return {
    unitTokens: 1_000_000n,
    minInputTokensPerRequest: 0n,
    maxInputTokensPerRequest: null,
    inputPerUnit: "1",
    outputPerUnit: "4",
    ...overrides,
  };
}

function pricing(
  id: string,
  effectiveFrom: string,
  bands: PricingBand[],
  overrides: Partial<ModelPricing> = {},
): ModelPricing {
  return {
    id,
    modelId: "model-test",
    currency: "USD",
    bands,
    effectiveFrom,
    effectiveFromBasis: "verified",
    effectiveTo: null,
    sourceUrl: "https://example.com/pricing",
    verifiedAt: effectiveFrom,
    notes: null,
    ...overrides,
  };
}

describe("derivePricingChanges", () => {
  it("groups changed dimensions for a compatible band and computes percentage delta", () => {
    const before = pricing("price-before", "2026-10-01T00:00:00.000Z", [band()]);
    const after = pricing(
      "price-after",
      "2027-01-01T00:00:00.000Z",
      [band({ inputPerUnit: "2", cachedInputPerUnit: "0.2" })],
      { effectiveFromBasis: "official", verifiedAt: "2026-10-05T00:00:00.000Z" },
    );

    expect(derivePricingChanges([before, after])).toEqual([
      {
        modelId: "model-test",
        previousPricingId: "price-before",
        pricingId: "price-after",
        effectiveFrom: "2027-01-01T00:00:00.000Z",
        effectiveFromBasis: "official",
        verifiedAt: "2026-10-05T00:00:00.000Z",
        sourceUrl: "https://example.com/pricing",
        band: {
          unitTokens: 1_000_000n,
          minInputTokensPerRequest: 0n,
          maxInputTokensPerRequest: null,
        },
        changes: [
          {
            dimension: "inputPerUnit",
            previous: "1",
            current: "2",
            percentageDelta: "100",
          },
          {
            dimension: "cachedInputPerUnit",
            previous: null,
            current: "0.2",
            percentageDelta: null,
          },
        ],
      },
    ]);
  });

  it("emits no event for unchanged numeric rates that were only re-verified", () => {
    const before = pricing("price-before", "2026-10-01T00:00:00.000Z", [band()]);
    const reverified = pricing(
      "price-reverified",
      "2026-10-05T00:00:00.000Z",
      [band()],
      {
        verifiedAt: "2026-10-06T00:00:00.000Z",
        sourceUrl: "https://example.com/new-source",
        notes: "metadata changed",
      },
    );

    expect(derivePricingChanges([before, reverified])).toEqual([]);
  });

  it("compares only like-for-like context bands", () => {
    const before = pricing("price-before", "2026-10-01T00:00:00.000Z", [
      band({ maxInputTokensPerRequest: 100_000n }),
      band({ minInputTokensPerRequest: 100_001n, outputPerUnit: "8" }),
    ]);
    const after = pricing("price-after", "2026-11-01T00:00:00.000Z", [
      band({ maxInputTokensPerRequest: 120_000n, inputPerUnit: "9" }),
      band({ minInputTokensPerRequest: 100_001n, outputPerUnit: "10" }),
    ]);

    const events = derivePricingChanges([before, after]);

    expect(events).toHaveLength(1);
    expect(events[0].band.minInputTokensPerRequest).toBe(100_001n);
    expect(events[0].changes).toEqual([
      {
        dimension: "outputPerUnit",
        previous: "8",
        current: "10",
        percentageDelta: "25",
      },
    ]);
  });

  it("sorts transitions by effective date before deriving events", () => {
    const first = pricing("price-1", "2026-10-01T00:00:00.000Z", [band({ inputPerUnit: "1" })]);
    const second = pricing("price-2", "2026-11-01T00:00:00.000Z", [band({ inputPerUnit: "2" })]);
    const third = pricing("price-3", "2026-12-01T00:00:00.000Z", [band({ inputPerUnit: "3" })]);

    expect(derivePricingChanges([third, first, second]).map((event) => event.pricingId)).toEqual([
      "price-2",
      "price-3",
    ]);
  });

  it("represents a removed rate dimension as unavailable without a percentage", () => {
    const before = pricing("price-before", "2026-10-01T00:00:00.000Z", [
      band({ cachedInputPerUnit: "0.2" }),
    ]);
    const after = pricing("price-after", "2026-11-01T00:00:00.000Z", [band()]);

    expect(derivePricingChanges([before, after])[0].changes).toContainEqual({
      dimension: "cachedInputPerUnit",
      previous: "0.2",
      current: null,
      percentageDelta: null,
    });
  });
});