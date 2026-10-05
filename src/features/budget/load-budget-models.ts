import { createPricingRepository } from "@/infrastructure/repositories/create-pricing-repository";
import type { BudgetModel } from "./budget-calculator";

export async function loadBudgetModels(asOf = new Date()): Promise<BudgetModel[]> {
  const repository = createPricingRepository();
  const [providers, models] = await Promise.all([
    repository.listProviders(),
    repository.listModels(),
  ]);
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const priced = await Promise.all(models.map(async (model) => ({
    model,
    pricing: await repository.getCurrentPricing(model.id, asOf),
  })));

  return priced.flatMap(({ model, pricing }) => {
    if (!pricing) return [];
    return [{
      pricingId: pricing.id,
      slug: model.slug,
      name: model.name,
      provider: providerById.get(model.providerId)?.name ?? "Unknown provider",
      sourceUrl: pricing.sourceUrl,
      verifiedAt: pricing.verifiedAt,
      bands: pricing.bands.map((band) => ({
        unitTokens: band.unitTokens.toString(),
        minInputTokensPerRequest: band.minInputTokensPerRequest.toString(),
        maxInputTokensPerRequest: band.maxInputTokensPerRequest?.toString() ?? null,
        inputPerUnit: band.inputPerUnit,
        outputPerUnit: band.outputPerUnit,
        cachedInputPerUnit: band.cachedInputPerUnit,
      })),
    }];
  });
}
