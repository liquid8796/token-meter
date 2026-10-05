import Decimal from "decimal.js";

import { calculateModelCost } from "./calculate-cost";
import type { MoneyValue, PricingBand, Workload } from "./types";

export interface OptimizationResult {
  baseline: MoneyValue;
  optimized: MoneyValue;
  absoluteSavings: MoneyValue;
  percentageSavings: string;
  limitation: string;
}

function resultFromCosts(
  baselineValue: string,
  optimizedValue: string,
  limitation: string,
): OptimizationResult | null {
  const baseline = new Decimal(baselineValue);
  const optimized = new Decimal(optimizedValue);
  if (!baseline.isFinite() || !optimized.isFinite() || baseline.lte(0)) return null;

  const absoluteSavings = baseline.minus(optimized);
  const percentageSavings = absoluteSavings.div(baseline).mul(100);

  return {
    baseline: baseline.toFixed(),
    optimized: optimized.toFixed(),
    absoluteSavings: absoluteSavings.toFixed(),
    percentageSavings: percentageSavings.toFixed(),
    limitation,
  };
}

function hasRegularRates(workload: Workload, band: PricingBand) {
  return !(
    (workload.inputTokens > 0n && band.inputPerUnit === undefined) ||
    (workload.outputTokens > 0n && band.outputPerUnit === undefined)
  );
}

export function calculateCacheOptimization(
  workload: Workload,
  band: PricingBand,
): OptimizationResult | null {
  if (
    workload.cachedInputTokens <= 0n ||
    band.cachedInputPerUnit === undefined ||
    !hasRegularRates(workload, band)
  ) {
    return null;
  }

  const baselineWorkload: Workload = { ...workload, cachedInputTokens: 0n };
  const baseline = calculateModelCost(baselineWorkload, band).totalCost;
  const optimized = calculateModelCost(workload, band).totalCost;

  return resultFromCosts(
    baseline,
    optimized,
    "Cache savings use the published cache-read rate for the declared cached subset; cache-write or storage charges are not added to this comparison.",
  );
}

export function calculateBatchOptimization(
  workload: Workload,
  band: PricingBand,
): OptimizationResult | null {
  if (workload.cachedInputTokens > 0n || !hasRegularRates(workload, band)) return null;
  if (workload.inputTokens > 0n && band.batchInputPerUnit === undefined) return null;
  if (workload.outputTokens > 0n && band.batchOutputPerUnit === undefined) return null;

  const baseline = calculateModelCost(workload, band).totalCost;
  const batchBand: PricingBand = {
    ...band,
    inputPerUnit: band.batchInputPerUnit,
    outputPerUnit: band.batchOutputPerUnit,
    cachedInputPerUnit: undefined,
  };
  const optimized = calculateModelCost(workload, batchBand).totalCost;

  return resultFromCosts(
    baseline,
    optimized,
    "Batch pricing is asynchronous and can have separate completion windows, eligibility, and limits; compare it only when that delivery model fits the workload.",
  );
}
