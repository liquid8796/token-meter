import type {
  AiModel,
  ModelPricing,
  ModelStatus,
  Provider,
} from "@/domain/pricing/types";

export interface ModelFilter {
  providerId?: string;
  status?: ModelStatus;
}

export interface PricingRepository {
  listProviders(): Promise<Provider[]>;
  listModels(filter?: ModelFilter): Promise<AiModel[]>;
  getModelBySlug(slug: string): Promise<AiModel | null>;
  getProviderBySlug(slug: string): Promise<Provider | null>;
  getCurrentPricing(modelId: string, asOf?: Date): Promise<ModelPricing | null>;
}
