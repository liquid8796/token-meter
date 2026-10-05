import { describe, expect, it } from "vitest";

import { hydrateModelPricing } from "./postgres-row-mappers";

describe("hydrateModelPricing", () => {
  it("hydrates sorted bigint pricing bands without numeric precision loss", () => {
    const pricing = hydrateModelPricing(
      {
        id: "price-test",
        modelId: "model-test",
        currency: "USD",
        effectiveFrom: new Date("2026-10-05T00:00:00.000Z"),
        effectiveTo: null,
        effectiveFromBasis: "official",
        sourceUrl: "https://developers.openai.com/api/docs/pricing",
        verifiedAt: new Date("2026-10-05T00:00:00.000Z"),
        notes: null,
      },
      [
        {
          id: "band-long",
          pricingId: "price-test",
          unitTokens: "1000000",
          minInputTokensPerRequest: "272001",
          maxInputTokensPerRequest: null,
          inputPerUnit: "4",
          outputPerUnit: "15",
          cachedInputPerUnit: "0.2",
          cacheWritePerUnit: "5",
          batchInputPerUnit: null,
          batchOutputPerUnit: null,
        },
        {
          id: "band-short",
          pricingId: "price-test",
          unitTokens: "1000000",
          minInputTokensPerRequest: "0",
          maxInputTokensPerRequest: "272000",
          inputPerUnit: "2",
          outputPerUnit: "10",
          cachedInputPerUnit: "0.1",
          cacheWritePerUnit: "2.5",
          batchInputPerUnit: null,
          batchOutputPerUnit: null,
        },
      ],
    );

    expect(pricing.currency).toBe("USD");
    expect(pricing.effectiveFrom).toBe("2026-10-05T00:00:00.000Z");
    expect(pricing.effectiveFromBasis).toBe("official");
    expect(pricing.bands[0].minInputTokensPerRequest).toBe(0n);
    expect(pricing.bands[0].maxInputTokensPerRequest).toBe(272_000n);
    expect(pricing.bands[1].minInputTokensPerRequest).toBe(272_001n);
  });
});
