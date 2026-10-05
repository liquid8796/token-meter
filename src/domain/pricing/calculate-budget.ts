import Decimal from "decimal.js";

import { calculateModelCost } from "./calculate-cost";
import type { MoneyValue, PricingBand, Workload } from "./types";

const MAX_BUDGET_USD = new Decimal("1000000000000");
const MAX_RESULT_QUANTITY = 1_000_000_000_000_000_000n;

export interface BudgetScaleResult {
  scale: string;
  inputTokens: bigint;
  outputTokens: bigint;
  cachedInputTokens: bigint;
  estimatedSpend: MoneyValue;
}

export interface RequestBudgetResult {
  requestCount: bigint;
  inputTokens: bigint;
  outputTokens: bigint;
  cachedInputTokens: bigint;
  estimatedSpend: MoneyValue;
}

function parseBudget(budgetUsd: string): Decimal | null {
  try {
    const budget = new Decimal(budgetUsd.trim());
    if (!budget.isFinite() || budget.lte(0) || budget.gt(MAX_BUDGET_USD)) return null;
    return budget;
  } catch {
    return null;
  }
}

function workloadCost(workload: Workload, band: PricingBand): Decimal | null {
  try {
    const cost = new Decimal(calculateModelCost(workload, band).totalCost);
    return cost.isFinite() && cost.gt(0) ? cost : null;
  } catch {
    return null;
  }
}

function floorScaled(value: bigint, scale: Decimal): bigint | null {
  if (value === 0n) return 0n;
  const scaled = new Decimal(value.toString()).mul(scale).floor();
  if (!scaled.isFinite() || scaled.lt(0)) return null;
  const result = BigInt(scaled.toFixed(0));
  return result <= MAX_RESULT_QUANTITY ? result : null;
}

function scaledWorkload(workload: Workload, scale: Decimal): Workload | null {
  const inputTokens = floorScaled(workload.inputTokens, scale);
  const outputTokens = floorScaled(workload.outputTokens, scale);
  const cachedInputTokens = floorScaled(workload.cachedInputTokens, scale);
  if (inputTokens === null || outputTokens === null || cachedInputTokens === null) return null;
  if (cachedInputTokens > inputTokens) return null;
  if (inputTokens === 0n && outputTokens === 0n) return null;
  return { inputTokens, outputTokens, cachedInputTokens };
}

export function solveTokenMixBudget(
  budgetUsd: string,
  workloadUnit: Workload,
  band: PricingBand,
): BudgetScaleResult | null {
  const budget = parseBudget(budgetUsd);
  const unitCost = workloadCost(workloadUnit, band);
  if (!budget || !unitCost) return null;

  const scale = budget.div(unitCost);
  if (!scale.isFinite() || scale.lte(0)) return null;
  const workload = scaledWorkload(workloadUnit, scale);
  if (!workload) return null;
  const estimatedSpend = workloadCost(workload, band);
  if (!estimatedSpend || estimatedSpend.gt(budget)) return null;

  return {
    scale: scale.toFixed(),
    ...workload,
    estimatedSpend: estimatedSpend.toFixed(),
  };
}

export function solveRequestBudget(
  budgetUsd: string,
  perRequestWorkload: Workload,
  band: PricingBand,
): RequestBudgetResult | null {
  const budget = parseBudget(budgetUsd);
  const requestCost = workloadCost(perRequestWorkload, band);
  if (!budget || !requestCost) return null;

  const requestCountDecimal = budget.div(requestCost).floor();
  if (!requestCountDecimal.isFinite() || requestCountDecimal.lt(1)) return null;
  const requestCount = BigInt(requestCountDecimal.toFixed(0));
  if (requestCount > MAX_RESULT_QUANTITY) return null;

  const workload = scaledWorkload(perRequestWorkload, requestCountDecimal);
  if (!workload) return null;
  const estimatedSpend = workloadCost(workload, band);
  if (!estimatedSpend || estimatedSpend.gt(budget)) return null;

  return {
    requestCount,
    ...workload,
    estimatedSpend: estimatedSpend.toFixed(),
  };
}
