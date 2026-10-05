import { describe, expect, it } from "vitest";

import { PRICING_SNAPSHOT } from "@/data/pricing-snapshot";
import { SnapshotPricingRepository } from "./snapshot-pricing-repository";

describe("SnapshotPricingRepository", () => {
  const repository = new SnapshotPricingRepository(PRICING_SNAPSHOT);

  it("lists active providers in stable name order", async () => {
    const providers = await repository.listProviders();

    expect(providers.map((provider) => provider.slug)).toEqual([
      "anthropic",
      "google",
      "openai",
    ]);
  });

  it("lists only active models when requested", async () => {
    const models = await repository.listModels({ status: "active" });

    expect(models).toHaveLength(7);
    expect(models.every((model) => model.status === "active")).toBe(true);
    expect(models.map((model) => model.slug)).toContain("gpt-6.1-sol");
  });

  it("includes preview models when no status filter is supplied", async () => {
    const models = await repository.listModels();

    expect(models).toHaveLength(8);
    expect(models.find((model) => model.slug === "gemini-3.1-pro-preview")?.status).toBe(
      "preview",
    );
  });

  it("finds canonical models and providers by slug", async () => {
    const model = await repository.getModelBySlug("claude-opus-5-5");
    const provider = await repository.getProviderBySlug("anthropic");

    expect(model?.apiModelId).toBe("claude-opus-5-5");
    expect(model?.contextWindowTokens).toBe(1_000_000n);
    expect(provider?.name).toBe("Anthropic");
  });

  it("returns null for unknown slugs", async () => {
    await expect(repository.getModelBySlug("missing-model")).resolves.toBeNull();
    await expect(repository.getProviderBySlug("missing-provider")).resolves.toBeNull();
  });

  it("selects the pricing record effective for the requested date", async () => {
    const model = await repository.getModelBySlug("gemini-3.8-flash");
    expect(model).not.toBeNull();

    const current = await repository.getCurrentPricing(model!.id, new Date("2026-10-05"));
    const future = await repository.getCurrentPricing(model!.id, new Date("2027-01-02"));

    expect(current?.bands[0].inputPerUnit).toBe("0.75");
    expect(current?.bands[0].outputPerUnit).toBe("3.75");
    expect(future?.bands[0].inputPerUnit).toBe("1.5");
    expect(future?.bands[0].outputPerUnit).toBe("7.5");
  });

  it("preserves context-sensitive pricing bands", async () => {
    const model = await repository.getModelBySlug("gpt-6.1-sol");
    const pricing = await repository.getCurrentPricing(model!.id, new Date("2026-10-05"));

    expect(pricing?.bands).toHaveLength(2);
    expect(pricing?.bands[0].maxInputTokensPerRequest).toBe(272_000n);
    expect(pricing?.bands[1].minInputTokensPerRequest).toBe(272_001n);
    expect(pricing?.bands[1].inputPerUnit).toBe("4");
    expect(pricing?.bands[1].outputPerUnit).toBe("15");
  });
});
