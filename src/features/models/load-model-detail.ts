import type { AiModel, ModelPricing, Provider } from "@/domain/pricing/types";
import { createPricingRepository } from "@/infrastructure/repositories/create-pricing-repository";
import { loadModelHistory, type ModelHistoryState } from "@/features/history/load-model-history";

export interface ModelDetail {
  model: AiModel;
  provider: Provider;
  pricing: ModelPricing;
  relatedModels: AiModel[];
  history: ModelHistoryState;
}

export async function loadModelDetail(
  slug: string,
  asOf = new Date(),
): Promise<ModelDetail | null> {
  const repository = createPricingRepository();
  const model = await repository.getModelBySlug(slug);
  if (!model) return null;

  const [providers, pricing, providerModels, history] = await Promise.all([
    repository.listProviders(),
    repository.getCurrentPricing(model.id, asOf),
    repository.listModels({ providerId: model.providerId }),
    loadModelHistory(model.id),
  ]);
  const provider = providers.find((candidate) => candidate.id === model.providerId);

  if (!provider || !pricing) return null;

  const relatedModels = providerModels.filter(
    (candidate) =>
      candidate.id !== model.id &&
      candidate.family === model.family &&
      (candidate.status === "active" || candidate.status === "preview"),
  );

  return { model, provider, pricing, relatedModels, history };
}