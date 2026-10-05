import { derivePricingChanges, type PriceChangeEvent } from "@/domain/pricing/pricing-history";
import type { AiModel, ModelPricing, Provider } from "@/domain/pricing/types";
import { createPricingHistoryRepository } from "@/infrastructure/repositories/create-pricing-history-repository";
import { createPricingRepository } from "@/infrastructure/repositories/create-pricing-repository";

export interface ProviderPricedModel {
  model: AiModel;
  pricing: ModelPricing | null;
}

export interface ProviderDetail {
  provider: Provider;
  models: ProviderPricedModel[];
  historyStatus: "ready" | "unavailable";
  recentChanges: PriceChangeEvent[];
}

export async function loadProviderDetail(
  slug: string,
  asOf = new Date(),
): Promise<ProviderDetail | null> {
  const repository = createPricingRepository();
  const provider = await repository.getProviderBySlug(slug);
  if (!provider) return null;

  const providerModels = (await repository.listModels({ providerId: provider.id })).filter(
    (model) => model.status === "active" || model.status === "preview",
  );
  const models = await Promise.all(
    providerModels.map(async (model) => ({
      model,
      pricing: await repository.getCurrentPricing(model.id, asOf),
    })),
  );

  const historyRepository = createPricingHistoryRepository();
  if (!historyRepository) {
    return { provider, models, historyStatus: "unavailable", recentChanges: [] };
  }

  try {
    const histories = await Promise.all(
      providerModels.map((model) => historyRepository.listPricingHistory(model.id)),
    );
    const recentChanges = histories
      .flatMap((history) => derivePricingChanges(history))
      .toSorted((left, right) =>
        right.effectiveFrom.localeCompare(left.effectiveFrom) ||
        right.pricingId.localeCompare(left.pricingId),
      )
      .slice(0, 6);

    return { provider, models, historyStatus: "ready", recentChanges };
  } catch {
    return { provider, models, historyStatus: "unavailable", recentChanges: [] };
  }
}