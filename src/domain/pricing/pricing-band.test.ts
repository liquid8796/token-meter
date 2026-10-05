import { describe, expect, it } from "vitest";

import type { PricingBand } from "./types";
import { selectPricingBand } from "./pricing-band";

const BASE_BAND: PricingBand = {
  unitTokens: 1_000_000n,
  minInputTokensPerRequest: 0n,
  maxInputTokensPerRequest: 200_000n,
  inputPerUnit: "2",
  outputPerUnit: "8",
};

const LONG_CONTEXT_BAND: PricingBand = {
  unitTokens: 1_000_000n,
  minInputTokensPerRequest: 200_001n,
  maxInputTokensPerRequest: null,
  inputPerUnit: "4",
  outputPerUnit: "12",
};

describe("selectPricingBand", () => {
  it("uses the base band with an explicit assumption when request context is omitted", () => {
    const selection = selectPricingBand([LONG_CONTEXT_BAND, BASE_BAND]);

    expect(selection.band).toEqual(BASE_BAND);
    expect(selection.assumption).toBe("base-band");
  });

  it("selects the base band at its inclusive upper threshold", () => {
    const selection = selectPricingBand([BASE_BAND, LONG_CONTEXT_BAND], 200_000n);

    expect(selection.band).toEqual(BASE_BAND);
    expect(selection.assumption).toBeNull();
  });

  it("selects the long-context band from average input tokens per request", () => {
    const selection = selectPricingBand([BASE_BAND, LONG_CONTEXT_BAND], 350_000n);

    expect(selection.band).toEqual(LONG_CONTEXT_BAND);
    expect(selection.assumption).toBeNull();
  });

  it("rejects negative request context", () => {
    expect(() => selectPricingBand([BASE_BAND], -1n)).toThrow(/context/i);
  });

  it("fails instead of silently guessing when no configured band matches", () => {
    expect(() =>
      selectPricingBand(
        [
          BASE_BAND,
          {
            ...LONG_CONTEXT_BAND,
            minInputTokensPerRequest: 300_000n,
          },
        ],
        250_000n,
      ),
    ).toThrow(/pricing band/i);
  });
});
