import { describe, expect, it } from "vitest";

import type {
  ModelFilter,
  PricingRepository,
} from "@/application/ports/pricing-repository";
import { PRICING_SNAPSHOT } from "@/data/pricing-snapshot";
import type { AiModel, ModelPricing, Provider } from "@/domain/pricing/types";
import { SnapshotPricingRepository } from "./snapshot-pricing-repository";
import { ResilientPricingRepository } from "./resilient-pricing-repository";

class FailingPricingRepository implements PricingRepository {
  private fail(): never {
    throw new Error("database unavailable");
  }

  async listProviders(): Promise<Provider[]> {
    return this.fail();
  }

  async listModels(_filter?: ModelFilter): Promise<AiModel[]> {
    void _filter;
    return this.fail();
  }

  async getModelBySlug(_slug: string): Promise<AiModel | null> {
    void _slug;
    return this.fail();
  }

  async getProviderBySlug(_slug: string): Promise<Provider | null> {
    void _slug;
    return this.fail();
  }

  async getCurrentPricing(_modelId: string, _asOf?: Date): Promise<ModelPricing | null> {
    void _modelId;
    void _asOf;
    return this.fail();
  }
}

describe("ResilientPricingRepository", () => {
  const fallback = new SnapshotPricingRepository(PRICING_SNAPSHOT);
  const repository = new ResilientPricingRepository(
    new FailingPricingRepository(),
    fallback,
  );

  it("falls back to the trusted snapshot when provider reads fail", async () => {
    const providers = await repository.listProviders();

    expect(providers.map((provider) => provider.slug)).toEqual([
      "anthropic",
      "google",
      "openai",
    ]);
  });

  it("falls back for model and pricing reads without hiding absent records", async () => {
    const model = await repository.getModelBySlug("gpt-6.1-sol");
    const missing = await repository.getModelBySlug("does-not-exist");
    const pricing = await repository.getCurrentPricing(
      model!.id,
      new Date("2026-10-05"),
    );

    expect(model?.name).toBe("GPT-6.1 Sol");
    expect(missing).toBeNull();
    expect(pricing?.bands[0].inputPerUnit).toBe("2");
  });
});
