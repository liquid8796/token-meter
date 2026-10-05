import type { PricingHistoryRepository } from "@/application/ports/pricing-history-repository";
import type { PricingRepository } from "@/application/ports/pricing-repository";
import {
  derivePricingChanges,
  type PriceChangeEvent,
} from "@/domain/pricing/pricing-history";
import { createPricingHistoryRepository } from "@/infrastructure/repositories/create-pricing-history-repository";
import { createPricingRepository } from "@/infrastructure/repositories/create-pricing-repository";

export interface PriceChangeFeedItem extends PriceChangeEvent {
  modelName: string;
  modelSlug: string;
  providerId: string;
  providerName: string;
  providerSlug: string;
}

export interface PriceChangeFeedState {
  status: "ready" | "unavailable";
  items: PriceChangeFeedItem[];
}

export interface LoadPriceChangesOptions {
  limit: number;
  providerId?: string;
}

function boundedLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 20;
  return Math.min(100, Math.max(1, Math.floor(limit)));
}

function compareFeedItems(left: PriceChangeFeedItem, right: PriceChangeFeedItem): number {
  const date = right.effectiveFrom.localeCompare(left.effectiveFrom);
  if (date !== 0) return date;
  const model = left.modelName.localeCompare(right.modelName);
  if (model !== 0) return model;
  if (left.band.minInputTokensPerRequest < right.band.minInputTokensPerRequest) return -1;
  if (left.band.minInputTokensPerRequest > right.band.minInputTokensPerRequest) return 1;
  return left.pricingId.localeCompare(right.pricingId);
}

export async function loadPriceChanges(
  options: LoadPriceChangesOptions,
  historyRepository: PricingHistoryRepository | null = createPricingHistoryRepository(),
  identityRepository: PricingRepository = createPricingRepository(),
): Promise<PriceChangeFeedState> {
  if (!historyRepository) return { status: "unavailable", items: [] };

  try {
    const [providers, models] = await Promise.all([
      identityRepository.listProviders(),
      identityRepository.listModels(
        options.providerId ? { providerId: options.providerId } : undefined,
      ),
    ]);
    const providerById = new Map(providers.map((provider) => [provider.id, provider]));

    const histories = await Promise.all(
      models.map(async (model) => ({
        model,
        records: await historyRepository.listPricingHistory(model.id),
      })),
    );

    const items = histories.flatMap(({ model, records }): PriceChangeFeedItem[] => {
      const provider = providerById.get(model.providerId);
      if (!provider) return [];
      return derivePricingChanges(records).map((event) => ({
        ...event,
        modelName: model.name,
        modelSlug: model.slug,
        providerId: provider.id,
        providerName: provider.name,
        providerSlug: provider.slug,
      }));
    });

    return {
      status: "ready",
      items: items.toSorted(compareFeedItems).slice(0, boundedLimit(options.limit)),
    };
  } catch {
    return { status: "unavailable", items: [] };
  }
}
