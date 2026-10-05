import { describe, expect, it } from "vitest";

import { calculateModelCost } from "./calculate-cost";
import type { PricingBand, Workload } from "./types";

const STANDARD_PRICING: PricingBand = {
  unitTokens: 1_000_000n,
  minInputTokensPerRequest: 0n,
  maxInputTokensPerRequest: null,
  inputPerUnit: "2",
  outputPerUnit: "8",
};

describe("calculateModelCost", () => {
  it("calculates input and output spend without losing decimal precision", () => {
    const workload: Workload = {
      inputTokens: 3_000_000n,
      outputTokens: 1_000_000n,
      cachedInputTokens: 0n,
    };

    expect(calculateModelCost(workload, STANDARD_PRICING)).toEqual({
      inputCost: "6",
      outputCost: "8",
      cachedInputCost: null,
      totalCost: "14",
    });
  });

  it("charges cached input at its own rate and removes it from standard input", () => {
    const workload: Workload = {
      inputTokens: 1_000_000n,
      outputTokens: 250_000n,
      cachedInputTokens: 400_000n,
    };
    const pricing: PricingBand = {
      ...STANDARD_PRICING,
      cachedInputPerUnit: "0.5",
    };

    expect(calculateModelCost(workload, pricing)).toEqual({
      inputCost: "1.2",
      outputCost: "2",
      cachedInputCost: "0.2",
      totalCost: "3.4",
    });
  });

  it("rejects cached input when the pricing band does not support it", () => {
    const workload: Workload = {
      inputTokens: 1_000n,
      outputTokens: 0n,
      cachedInputTokens: 500n,
    };

    expect(() => calculateModelCost(workload, STANDARD_PRICING)).toThrow(/cached input/i);
  });

  it("rejects cached input larger than total input", () => {
    const workload: Workload = {
      inputTokens: 100n,
      outputTokens: 0n,
      cachedInputTokens: 101n,
    };

    expect(() =>
      calculateModelCost(workload, { ...STANDARD_PRICING, cachedInputPerUnit: "0.5" }),
    ).toThrow(/cannot exceed/i);
  });

  it("rejects negative workload dimensions", () => {
    expect(() =>
      calculateModelCost(
        { inputTokens: -1n, outputTokens: 0n, cachedInputTokens: 0n },
        STANDARD_PRICING,
      ),
    ).toThrow(/negative/i);
  });

  it("returns zero spend for a zero workload", () => {
    const workload: Workload = {
      inputTokens: 0n,
      outputTokens: 0n,
      cachedInputTokens: 0n,
    };

    expect(calculateModelCost(workload, STANDARD_PRICING).totalCost).toBe("0");
  });

  it("keeps sub-cent per-token precision in normal decimal notation", () => {
    const workload: Workload = {
      inputTokens: 1n,
      outputTokens: 0n,
      cachedInputTokens: 0n,
    };
    const pricing: PricingBand = {
      ...STANDARD_PRICING,
      inputPerUnit: "0.1",
    };

    expect(calculateModelCost(workload, pricing).inputCost).toBe("0.0000001");
  });
});
