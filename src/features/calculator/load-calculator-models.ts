import { createPricingRepository } from "@/infrastructure/repositories/create-pricing-repository";
import type { CalculatorModel } from "./calculator";

export async function loadCalculatorModels(asOf = new Date()): Promise<CalculatorModel[]> {
  const repository = createPricingRepository();
  const [providers, models] = await Promise.all([
    repository.listProviders(),
    repository.listModels(),
  ]);
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const pricedModels = await Promise.all(
    models.map(async (model) => ({
      model,
      pricing: await repository.getCurrentPricing(model.id, asOf),
    })),
  );

  return pricedModels.flatMap(({ model, pricing }) => {
    if (!pricing) return [];

    return [
      {
        slug: model.slug,
        name: model.name,
        provider: providerById.get(model.providerId)?.name ?? "Unknown provider",
        providerSlug: providerById.get(model.providerId)?.slug,
        status: model.status,
        contextWindowTokens: model.contextWindowTokens?.toString() ?? null,
        sourceUrl: pricing.sourceUrl,
        verifiedAt: pricing.verifiedAt,
        bands: pricing.bands.map((band) => ({
          unitTokens: band.unitTokens.toString(),
          minInputTokensPerRequest: band.minInputTokensPerRequest.toString(),
          maxInputTokensPerRequest: band.maxInputTokensPerRequest?.toString() ?? null,
          inputPerUnit: band.inputPerUnit,
          outputPerUnit: band.outputPerUnit,
          cachedInputPerUnit: band.cachedInputPerUnit,
          cacheWritePerUnit: band.cacheWritePerUnit,
          batchInputPerUnit: band.batchInputPerUnit,
          batchOutputPerUnit: band.batchOutputPerUnit,
        })),
      } satisfies CalculatorModel,
    ];
  });
}
