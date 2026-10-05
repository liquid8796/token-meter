import Decimal from "decimal.js";

import type { CostBreakdown, PricingBand, Workload } from "./types";

function ensureValidWorkload(workload: Workload) {
  if (
    workload.inputTokens < 0n ||
    workload.outputTokens < 0n ||
    workload.cachedInputTokens < 0n
  ) {
    throw new Error("Workload token counts cannot be negative");
  }

  if (workload.cachedInputTokens > workload.inputTokens) {
    throw new Error("Cached input tokens cannot exceed total input tokens");
  }
}

function costForTokens(tokens: bigint, ratePerUnit: string, unitTokens: bigint) {
  return new Decimal(tokens.toString())
    .mul(ratePerUnit)
    .div(unitTokens.toString());
}

function asMoneyString(value: Decimal) {
  return value.toFixed();
}

export function calculateModelCost(
  workload: Workload,
  pricing: PricingBand,
): CostBreakdown {
  ensureValidWorkload(workload);

  if (pricing.unitTokens <= 0n) {
    throw new Error("Pricing unit must be greater than zero");
  }

  if (workload.inputTokens > 0n && pricing.inputPerUnit === undefined) {
    throw new Error("Input pricing is unavailable for this pricing band");
  }

  if (workload.outputTokens > 0n && pricing.outputPerUnit === undefined) {
    throw new Error("Output pricing is unavailable for this pricing band");
  }

  if (
    workload.cachedInputTokens > 0n &&
    pricing.cachedInputPerUnit === undefined
  ) {
    throw new Error("Cached input pricing is unavailable for this pricing band");
  }

  const uncachedInputTokens = workload.inputTokens - workload.cachedInputTokens;
  const inputCost = pricing.inputPerUnit
    ? costForTokens(uncachedInputTokens, pricing.inputPerUnit, pricing.unitTokens)
    : new Decimal(0);
  const outputCost = pricing.outputPerUnit
    ? costForTokens(workload.outputTokens, pricing.outputPerUnit, pricing.unitTokens)
    : new Decimal(0);
  const cachedInputCost = pricing.cachedInputPerUnit
    ? costForTokens(
        workload.cachedInputTokens,
        pricing.cachedInputPerUnit,
        pricing.unitTokens,
      )
    : null;
  const totalCost = inputCost
    .plus(outputCost)
    .plus(cachedInputCost ?? new Decimal(0));

  return {
    inputCost: asMoneyString(inputCost),
    outputCost: asMoneyString(outputCost),
    cachedInputCost: cachedInputCost ? asMoneyString(cachedInputCost) : null,
    totalCost: asMoneyString(totalCost),
  };
}
