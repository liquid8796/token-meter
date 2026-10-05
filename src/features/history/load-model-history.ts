import type { PricingHistoryRepository } from "@/application/ports/pricing-history-repository";
import { derivePricingChanges, type PriceChangeEvent } from "@/domain/pricing/pricing-history";
import type { ModelPricing } from "@/domain/pricing/types";
import { createPricingHistoryRepository } from "@/infrastructure/repositories/create-pricing-history-repository";

export interface ModelHistoryState {
  status: "ready" | "unavailable";
  records: ModelPricing[];
  changes: PriceChangeEvent[];
}

export async function loadModelHistory(
  modelId: string,
  repository: PricingHistoryRepository | null = createPricingHistoryRepository(),
): Promise<ModelHistoryState> {
  if (!repository) {
    return { status: "unavailable", records: [], changes: [] };
  }

  try {
    const records = await repository.listPricingHistory(modelId);
    return {
      status: "ready",
      records,
      changes: derivePricingChanges(records),
    };
  } catch {
    return { status: "unavailable", records: [], changes: [] };
  }
}