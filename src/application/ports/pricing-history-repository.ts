import type { ModelPricing } from "@/domain/pricing/types";

export interface PricingHistoryRepository {
  listPricingHistory(modelId: string): Promise<ModelPricing[]>;
}