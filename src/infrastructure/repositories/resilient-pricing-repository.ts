import type {
  ModelFilter,
  PricingRepository,
} from "@/application/ports/pricing-repository";
import type { AiModel, ModelPricing, Provider } from "@/domain/pricing/types";

export class ResilientPricingRepository implements PricingRepository {
  constructor(
    private readonly primary: PricingRepository,
    private readonly fallback: PricingRepository,
  ) {}

  private async withFallback<T>(
    primaryRead: () => Promise<T>,
    fallbackRead: () => Promise<T>,
  ): Promise<T> {
    try {
      return await primaryRead();
    } catch {
      return fallbackRead();
    }
  }

  listProviders(): Promise<Provider[]> {
    return this.withFallback(
      () => this.primary.listProviders(),
      () => this.fallback.listProviders(),
    );
  }

  listModels(filter?: ModelFilter): Promise<AiModel[]> {
    return this.withFallback(
      () => this.primary.listModels(filter),
      () => this.fallback.listModels(filter),
    );
  }

  getModelBySlug(slug: string): Promise<AiModel | null> {
    return this.withFallback(
      () => this.primary.getModelBySlug(slug),
      () => this.fallback.getModelBySlug(slug),
    );
  }

  getProviderBySlug(slug: string): Promise<Provider | null> {
    return this.withFallback(
      () => this.primary.getProviderBySlug(slug),
      () => this.fallback.getProviderBySlug(slug),
    );
  }

  getCurrentPricing(modelId: string, asOf?: Date): Promise<ModelPricing | null> {
    return this.withFallback(
      () => this.primary.getCurrentPricing(modelId, asOf),
      () => this.fallback.getCurrentPricing(modelId, asOf),
    );
  }
}
