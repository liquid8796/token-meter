import type { PricingSnapshot } from "@/domain/pricing/types";

export function buildSeedRows(snapshot: PricingSnapshot) {
  return {
    providers: snapshot.providers.map((provider) => ({ ...provider })),
    models: snapshot.models.map((model) => ({
      ...model,
      contextWindowTokens: model.contextWindowTokens?.toString() ?? null,
      maxOutputTokens: model.maxOutputTokens?.toString() ?? null,
    })),
    pricing: snapshot.pricing.map((pricing) => ({
      id: pricing.id,
      modelId: pricing.modelId,
      currency: pricing.currency,
      effectiveFrom: new Date(pricing.effectiveFrom),
      effectiveFromBasis: pricing.effectiveFromBasis,
      effectiveTo: pricing.effectiveTo ? new Date(pricing.effectiveTo) : null,
      sourceUrl: pricing.sourceUrl,
      verifiedAt: new Date(pricing.verifiedAt),
      notes: pricing.notes,
    })),
    bands: snapshot.pricing.flatMap((pricing) =>
      pricing.bands.map((band, index) => ({
        id: `${pricing.id}-band-${index + 1}`,
        pricingId: pricing.id,
        unitTokens: band.unitTokens.toString(),
        minInputTokensPerRequest: band.minInputTokensPerRequest.toString(),
        maxInputTokensPerRequest:
          band.maxInputTokensPerRequest?.toString() ?? null,
        inputPerUnit: band.inputPerUnit ?? null,
        outputPerUnit: band.outputPerUnit ?? null,
        cachedInputPerUnit: band.cachedInputPerUnit ?? null,
        cacheWritePerUnit: band.cacheWritePerUnit ?? null,
        batchInputPerUnit: band.batchInputPerUnit ?? null,
        batchOutputPerUnit: band.batchOutputPerUnit ?? null,
      })),
    ),
  };
}
