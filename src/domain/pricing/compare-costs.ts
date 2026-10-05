import Decimal from "decimal.js";

import type { MoneyValue } from "./types";

export interface CostComparisonInput {
  key: string;
  totalCost: MoneyValue;
}

export interface ComparedCost extends CostComparisonInput {
  deltaFromCheapest: MoneyValue;
  isCheapest: boolean;
}

export function compareCosts(results: CostComparisonInput[]): ComparedCost[] {
  if (results.length === 0) {
    return [];
  }

  const sorted = [...results].sort((left, right) => {
    const costComparison = new Decimal(left.totalCost).comparedTo(right.totalCost);

    if (costComparison !== 0) {
      return costComparison;
    }

    return left.key.localeCompare(right.key);
  });
  const cheapest = new Decimal(sorted[0].totalCost);

  return sorted.map((result) => {
    const total = new Decimal(result.totalCost);
    const delta = total.minus(cheapest);

    return {
      ...result,
      deltaFromCheapest: delta.toFixed(),
      isCheapest: delta.isZero(),
    };
  });
}
