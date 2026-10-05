import type {
  ModelFilter,
  PricingRepository,
} from "@/application/ports/pricing-repository";
import type {
  AiModel,
  ModelPricing,
  PricingSnapshot,
  Provider,
} from "@/domain/pricing/types";

function isEffective(pricing: ModelPricing, asOf: Date) {
  const timestamp = asOf.getTime();
  const startsAt = new Date(pricing.effectiveFrom).getTime();
  const endsAt = pricing.effectiveTo
    ? new Date(pricing.effectiveTo).getTime()
    : Number.POSITIVE_INFINITY;

  return timestamp >= startsAt && timestamp <= endsAt;
}

export class SnapshotPricingRepository implements PricingRepository {
  constructor(private readonly snapshot: PricingSnapshot) {}

  async listProviders(): Promise<Provider[]> {
    return this.snapshot.providers
      .filter((provider) => provider.isActive)
      .toSorted((left, right) => left.name.localeCompare(right.name));
  }

  async listModels(filter: ModelFilter = {}): Promise<AiModel[]> {
    return this.snapshot.models
      .filter((model) => !filter.providerId || model.providerId === filter.providerId)
      .filter((model) => !filter.status || model.status === filter.status)
      .toSorted((left, right) => left.name.localeCompare(right.name));
  }

  async getModelBySlug(slug: string): Promise<AiModel | null> {
    return this.snapshot.models.find((model) => model.slug === slug) ?? null;
  }

  async getProviderBySlug(slug: string): Promise<Provider | null> {
    return this.snapshot.providers.find((provider) => provider.slug === slug) ?? null;
  }

  async getCurrentPricing(
    modelId: string,
    asOf = new Date(),
  ): Promise<ModelPricing | null> {
    return (
      this.snapshot.pricing
        .filter((pricing) => pricing.modelId === modelId)
        .filter((pricing) => isEffective(pricing, asOf))
        .toSorted((left, right) =>
          right.effectiveFrom.localeCompare(left.effectiveFrom),
        )[0] ?? null
    );
  }
}
