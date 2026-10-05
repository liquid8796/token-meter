import type { ModelPricing, PricingBand } from "@/domain/pricing/types";

export interface PricingRow {
  id: string;
  modelId: string;
  currency: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  sourceUrl: string;
  verifiedAt: Date;
  notes: string | null;
}

export interface PricingBandRow {
  id: string;
  pricingId: string;
  unitTokens: string;
  minInputTokensPerRequest: string;
  maxInputTokensPerRequest: string | null;
  inputPerUnit: string | null;
  outputPerUnit: string | null;
  cachedInputPerUnit: string | null;
  cacheWritePerUnit: string | null;
  batchInputPerUnit: string | null;
  batchOutputPerUnit: string | null;
}

function optionalRate(value: string | null) {
  return value ?? undefined;
}

function hydrateBand(row: PricingBandRow): PricingBand {
  return {
    unitTokens: BigInt(row.unitTokens),
    minInputTokensPerRequest: BigInt(row.minInputTokensPerRequest),
    maxInputTokensPerRequest:
      row.maxInputTokensPerRequest === null
        ? null
        : BigInt(row.maxInputTokensPerRequest),
    inputPerUnit: optionalRate(row.inputPerUnit),
    outputPerUnit: optionalRate(row.outputPerUnit),
    cachedInputPerUnit: optionalRate(row.cachedInputPerUnit),
    cacheWritePerUnit: optionalRate(row.cacheWritePerUnit),
    batchInputPerUnit: optionalRate(row.batchInputPerUnit),
    batchOutputPerUnit: optionalRate(row.batchOutputPerUnit),
  };
}

export function hydrateModelPricing(
  pricingRow: PricingRow,
  bandRows: PricingBandRow[],
): ModelPricing {
  if (pricingRow.currency !== "USD") {
    throw new Error(`Unsupported pricing currency: ${pricingRow.currency}`);
  }

  return {
    id: pricingRow.id,
    modelId: pricingRow.modelId,
    currency: "USD",
    effectiveFrom: pricingRow.effectiveFrom.toISOString(),
    effectiveTo: pricingRow.effectiveTo?.toISOString() ?? null,
    sourceUrl: pricingRow.sourceUrl,
    verifiedAt: pricingRow.verifiedAt.toISOString(),
    notes: pricingRow.notes,
    bands: bandRows
      .map(hydrateBand)
      .toSorted((left, right) =>
        left.minInputTokensPerRequest < right.minInputTokensPerRequest ? -1 : 1,
      ),
  };
}
