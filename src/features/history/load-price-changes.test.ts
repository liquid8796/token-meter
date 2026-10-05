import { describe, expect, it } from "vitest";

import type { PricingHistoryRepository } from "@/application/ports/pricing-history-repository";
import { PRICING_SNAPSHOT } from "@/data/pricing-snapshot";
import type { ModelPricing } from "@/domain/pricing/types";
import { SnapshotPricingRepository } from "@/infrastructure/repositories/snapshot-pricing-repository";
import { loadPriceChanges } from "./load-price-changes";

class SnapshotHistoryRepository implements PricingHistoryRepository {
  async listPricingHistory(modelId: string): Promise<ModelPricing[]> {
    return PRICING_SNAPSHOT.pricing.filter((pricing) => pricing.modelId === modelId);
  }
}

class ThrowingHistoryRepository implements PricingHistoryRepository {
  async listPricingHistory(): Promise<ModelPricing[]> {
    throw new Error("db unavailable");
  }
}

const identityRepository = new SnapshotPricingRepository(PRICING_SNAPSHOT);

describe("loadPriceChanges", () => {
  it("emits the real announced Gemini transition with official-date semantics", async () => {
    const state = await loadPriceChanges(
      { limit: 20 },
      new SnapshotHistoryRepository(),
      identityRepository,
    );

    expect(state.status).toBe("ready");
    const gemini = state.items.find((item) => item.modelSlug === "gemini-3.8-flash");
    expect(gemini).toMatchObject({
      providerSlug: "google",
      effectiveFrom: "2027-01-01T00:00:00.000Z",
      effectiveFromBasis: "official",
    });
    expect(gemini?.changes.map((change) => change.dimension)).toEqual([
      "inputPerUnit",
      "outputPerUnit",
      "cachedInputPerUnit",
    ]);
  });

  it("returns newest-first deterministic bounded output", async () => {
    const state = await loadPriceChanges(
      { limit: 1 },
      new SnapshotHistoryRepository(),
      identityRepository,
    );

    expect(state.status).toBe("ready");
    expect(state.items).toHaveLength(1);
    expect(state.items[0].effectiveFrom).toBe("2027-01-01T00:00:00.000Z");
  });

  it("filters by provider id before deriving the feed", async () => {
    const state = await loadPriceChanges(
      { limit: 20, providerId: "provider-google" },
      new SnapshotHistoryRepository(),
      identityRepository,
    );

    expect(state.items.length).toBeGreaterThan(0);
    expect(state.items.every((item) => item.providerId === "provider-google")).toBe(true);
  });

  it("degrades history explicitly when PostgreSQL history is unavailable", async () => {
    const state = await loadPriceChanges(
      { limit: 20 },
      new ThrowingHistoryRepository(),
      identityRepository,
    );

    expect(state).toEqual({ status: "unavailable", items: [] });
  });

  it("returns unavailable when no history repository exists", async () => {
    expect(await loadPriceChanges({ limit: 20 }, null, identityRepository)).toEqual({
      status: "unavailable",
      items: [],
    });
  });
});
