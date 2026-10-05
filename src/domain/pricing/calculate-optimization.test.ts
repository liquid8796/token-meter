import { describe, expect, it } from "vitest";

import { selectPricingBand } from "./pricing-band";
import type { PricingBand, Workload } from "./types";
import {
  calculateBatchOptimization,
  calculateCacheOptimization,
} from "./calculate-optimization";

const baseBand: PricingBand = {
  unitTokens: 1_000_000n,
  minInputTokensPerRequest: 0n,
  maxInputTokensPerRequest: null,
  inputPerUnit: "2",
  outputPerUnit: "10",
  cachedInputPerUnit: "0.2",
  batchInputPerUnit: "1",
  batchOutputPerUnit: "5",
};

const cachedWorkload: Workload = {
  inputTokens: 10_000_000n,
  outputTokens: 2_000_000n,
  cachedInputTokens: 4_000_000n,
};

const regularWorkload: Workload = {
  ...cachedWorkload,
  cachedInputTokens: 0n,
};

describe("calculateCacheOptimization", () => {
  it("compares regular input against the declared cached subset", () => {
    expect(calculateCacheOptimization(cachedWorkload, baseBand)).toMatchObject({
      baseline: "40",
      optimized: "32.8",
      absoluteSavings: "7.2",
      percentageSavings: "18",
    });
  });

  it("returns null when there is no cached workload or published cache rate", () => {
    expect(calculateCacheOptimization(regularWorkload, baseBand)).toBeNull();
    expect(
      calculateCacheOptimization(cachedWorkload, { ...baseBand, cachedInputPerUnit: undefined }),
    ).toBeNull();
  });

  it("uses the selected long-context band's rates", () => {
    const bands: PricingBand[] = [
      { ...baseBand, maxInputTokensPerRequest: 200_000n },
      {
        ...baseBand,
        minInputTokensPerRequest: 200_001n,
        inputPerUnit: "4",
        cachedInputPerUnit: "0.4",
        outputPerUnit: "18",
      },
    ];
    const selected = selectPricingBand(bands, 300_000n).band;

    expect(calculateCacheOptimization(cachedWorkload, selected)).toMatchObject({
      baseline: "76",
      optimized: "61.6",
      absoluteSavings: "14.4",
    });
  });
});

describe("calculateBatchOptimization", () => {
  it("calculates supported async batch savings with decimal-safe math", () => {
    expect(calculateBatchOptimization(regularWorkload, baseBand)).toMatchObject({
      baseline: "40",
      optimized: "20",
      absoluteSavings: "20",
      percentageSavings: "50",
    });
  });

  it("returns null when a required published batch dimension is missing", () => {
    expect(
      calculateBatchOptimization(regularWorkload, { ...baseBand, batchOutputPerUnit: undefined }),
    ).toBeNull();
  });

  it("returns null for cached workloads without a comparable batch-cache rate", () => {
    expect(calculateBatchOptimization(cachedWorkload, baseBand)).toBeNull();
  });

  it("keeps precision for tiny token quantities", () => {
    const tiny: Workload = { inputTokens: 1n, outputTokens: 1n, cachedInputTokens: 0n };
    const result = calculateBatchOptimization(tiny, {
      ...baseBand,
      inputPerUnit: "0.123456",
      outputPerUnit: "0.654321",
      batchInputPerUnit: "0.061728",
      batchOutputPerUnit: "0.3271605",
    });

    expect(result).toMatchObject({
      baseline: "0.000000777777",
      optimized: "0.0000003888885",
      absoluteSavings: "0.0000003888885",
      percentageSavings: "50",
    });
  });
});
