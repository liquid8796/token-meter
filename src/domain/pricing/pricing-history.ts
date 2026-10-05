import Decimal from "decimal.js";

import type { ModelPricing, MoneyValue, PricingBand } from "./types";

export type PriceRateDimension =
  | "inputPerUnit"
  | "outputPerUnit"
  | "cachedInputPerUnit"
  | "cacheWritePerUnit"
  | "batchInputPerUnit"
  | "batchOutputPerUnit";

export interface PriceRateChange {
  dimension: PriceRateDimension;
  previous: MoneyValue | null;
  current: MoneyValue | null;
  percentageDelta: MoneyValue | null;
}

export interface PriceChangeBand {
  unitTokens: bigint;
  minInputTokensPerRequest: bigint;
  maxInputTokensPerRequest: bigint | null;
}

export interface PriceChangeEvent {
  modelId: string;
  previousPricingId: string;
  pricingId: string;
  effectiveFrom: string;
  effectiveFromBasis: ModelPricing["effectiveFromBasis"];
  verifiedAt: string;
  sourceUrl: string;
  band: PriceChangeBand;
  changes: PriceRateChange[];
}

const RATE_DIMENSIONS: readonly PriceRateDimension[] = [
  "inputPerUnit",
  "outputPerUnit",
  "cachedInputPerUnit",
  "cacheWritePerUnit",
  "batchInputPerUnit",
  "batchOutputPerUnit",
];

function sameNullableBigint(left: bigint | null, right: bigint | null) {
  return left === right;
}

function sameBand(left: PricingBand, right: PricingBand) {
  return (
    left.unitTokens === right.unitTokens &&
    left.minInputTokensPerRequest === right.minInputTokensPerRequest &&
    sameNullableBigint(left.maxInputTokensPerRequest, right.maxInputTokensPerRequest)
  );
}

function asNullableRate(value: MoneyValue | undefined): MoneyValue | null {
  return value ?? null;
}

function ratesEqual(left: MoneyValue | null, right: MoneyValue | null) {
  if (left === null || right === null) {
    return left === right;
  }

  return new Decimal(left).equals(right);
}

function percentageDelta(
  previous: MoneyValue | null,
  current: MoneyValue | null,
): MoneyValue | null {
  if (previous === null || current === null) {
    return null;
  }

  const base = new Decimal(previous);
  if (base.isZero()) {
    return null;
  }

  return new Decimal(current)
    .minus(base)
    .div(base)
    .mul(100)
    .toDecimalPlaces(12)
    .toString();
}

function comparePricing(left: ModelPricing, right: ModelPricing) {
  const time = left.effectiveFrom.localeCompare(right.effectiveFrom);
  return time !== 0 ? time : left.id.localeCompare(right.id);
}

function compareBands(left: PricingBand, right: PricingBand) {
  if (left.minInputTokensPerRequest < right.minInputTokensPerRequest) return -1;
  if (left.minInputTokensPerRequest > right.minInputTokensPerRequest) return 1;
  const leftCeiling = left.maxInputTokensPerRequest;
  const rightCeiling = right.maxInputTokensPerRequest;
  if (leftCeiling === rightCeiling) return 0;
  if (leftCeiling === null) return 1;
  if (rightCeiling === null) return -1;
  return leftCeiling < rightCeiling ? -1 : 1;
}

export function derivePricingChanges(
  history: readonly ModelPricing[],
): PriceChangeEvent[] {
  const sortedHistory = [...history].sort(comparePricing);
  const events: PriceChangeEvent[] = [];

  for (let index = 1; index < sortedHistory.length; index += 1) {
    const previousPricing = sortedHistory[index - 1];
    const currentPricing = sortedHistory[index];

    if (
      previousPricing.modelId !== currentPricing.modelId ||
      previousPricing.currency !== currentPricing.currency
    ) {
      continue;
    }

    for (const previousBand of [...previousPricing.bands].sort(compareBands)) {
      const currentBand = currentPricing.bands.find((candidate) =>
        sameBand(previousBand, candidate),
      );
      if (!currentBand) continue;

      const changes = RATE_DIMENSIONS.flatMap((dimension): PriceRateChange[] => {
        const previous = asNullableRate(previousBand[dimension]);
        const current = asNullableRate(currentBand[dimension]);
        if (ratesEqual(previous, current)) return [];

        return [
          {
            dimension,
            previous,
            current,
            percentageDelta: percentageDelta(previous, current),
          },
        ];
      });

      if (changes.length === 0) continue;

      events.push({
        modelId: currentPricing.modelId,
        previousPricingId: previousPricing.id,
        pricingId: currentPricing.id,
        effectiveFrom: currentPricing.effectiveFrom,
        effectiveFromBasis: currentPricing.effectiveFromBasis,
        verifiedAt: currentPricing.verifiedAt,
        sourceUrl: currentPricing.sourceUrl,
        band: {
          unitTokens: currentBand.unitTokens,
          minInputTokensPerRequest: currentBand.minInputTokensPerRequest,
          maxInputTokensPerRequest: currentBand.maxInputTokensPerRequest,
        },
        changes,
      });
    }
  }

  return events;
}