import { describe, expect, it } from "vitest";

import type { PricingBand, Workload } from "./types";
import { solveRequestBudget, solveTokenMixBudget } from "./calculate-budget";

const band: PricingBand = {
  unitTokens: 1_000_000n,
  minInputTokensPerRequest: 0n,
  maxInputTokensPerRequest: null,
  inputPerUnit: "2",
  outputPerUnit: "10",
  cachedInputPerUnit: "0.2",
};

describe("solveTokenMixBudget", () => {
  it("scales a mixed workload to a monthly budget", () => {
    const workload: Workload = {
      inputTokens: 1_000_000n,
      outputTokens: 500_000n,
      cachedInputTokens: 0n,
    };

    expect(solveTokenMixBudget("70", workload, band)).toMatchObject({
      scale: "10",
      inputTokens: 10_000_000n,
      outputTokens: 5_000_000n,
      cachedInputTokens: 0n,
      estimatedSpend: "70",
    });
  });

  it("preserves cached-input composition", () => {
    const workload: Workload = {
      inputTokens: 1_000_000n,
      outputTokens: 200_000n,
      cachedInputTokens: 400_000n,
    };

    expect(solveTokenMixBudget("32.8", workload, band)).toMatchObject({
      scale: "10",
      inputTokens: 10_000_000n,
      outputTokens: 2_000_000n,
      cachedInputTokens: 4_000_000n,
      estimatedSpend: "32.8",
    });
  });

  it("uses whichever pricing band the caller selected", () => {
    const highBand: PricingBand = { ...band, inputPerUnit: "4", outputPerUnit: "18" };
    const workload: Workload = { inputTokens: 1_000_000n, outputTokens: 0n, cachedInputTokens: 0n };

    expect(solveTokenMixBudget("40", workload, highBand)?.inputTokens).toBe(10_000_000n);
  });

  it.each(["0", "-1", "not-money", "1000000000001"])(
    "rejects invalid or unbounded budgets: %s",
    (budget) => {
      expect(solveTokenMixBudget(budget, { inputTokens: 1n, outputTokens: 0n, cachedInputTokens: 0n }, band)).toBeNull();
    },
  );

  it("returns null for zero or missing required unit costs", () => {
    const workload: Workload = { inputTokens: 1_000_000n, outputTokens: 0n, cachedInputTokens: 0n };
    expect(solveTokenMixBudget("100", workload, { ...band, inputPerUnit: "0" })).toBeNull();
    expect(solveTokenMixBudget("100", workload, { ...band, inputPerUnit: undefined })).toBeNull();
  });

  it("returns null instead of producing unbounded token quantities", () => {
    const workload: Workload = { inputTokens: 1n, outputTokens: 0n, cachedInputTokens: 0n };
    expect(solveTokenMixBudget("1000000000000", workload, { ...band, inputPerUnit: "0.000000000001" })).toBeNull();
  });
});

describe("solveRequestBudget", () => {
  const requestBand: PricingBand = {
    unitTokens: 1_000n,
    minInputTokensPerRequest: 0n,
    maxInputTokensPerRequest: null,
    inputPerUnit: "1",
    outputPerUnit: "1",
  };

  it("floors headline request count to a whole bigint", () => {
    const perRequest: Workload = { inputTokens: 500n, outputTokens: 500n, cachedInputTokens: 0n };

    expect(solveRequestBudget("10.9", perRequest, requestBand)).toMatchObject({
      requestCount: 10n,
      inputTokens: 5_000n,
      outputTokens: 5_000n,
      cachedInputTokens: 0n,
      estimatedSpend: "10",
    });
  });

  it("returns null for an unaffordable single request or unsupported cost", () => {
    const perRequest: Workload = { inputTokens: 500n, outputTokens: 500n, cachedInputTokens: 0n };
    expect(solveRequestBudget("0.5", perRequest, requestBand)).toBeNull();
    expect(solveRequestBudget("10", perRequest, { ...requestBand, outputPerUnit: undefined })).toBeNull();
  });
});
