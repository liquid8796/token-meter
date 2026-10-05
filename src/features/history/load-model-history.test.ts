import { describe, expect, it } from "vitest";

import type { PricingHistoryRepository } from "@/application/ports/pricing-history-repository";
import { PRICING_SNAPSHOT } from "@/data/pricing-snapshot";
import { loadModelHistory } from "./load-model-history";

class ThrowingHistoryRepository implements PricingHistoryRepository {
  async listPricingHistory(): Promise<never> {
    throw new Error("database unavailable");
  }
}

class SnapshotHistoryRepository implements PricingHistoryRepository {
  async listPricingHistory(modelId: string) {
    return PRICING_SNAPSHOT.pricing.filter((pricing) => pricing.modelId === modelId);
  }
}

describe("loadModelHistory", () => {
  it("derives changes when PostgreSQL history is available", async () => {
    const result = await loadModelHistory(
      "model-gemini-3-8-flash",
      new SnapshotHistoryRepository(),
    );

    expect(result.status).toBe("ready");
    expect(result.records).toHaveLength(2);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].effectiveFromBasis).toBe("official");
  });

  it("degrades history only when the history repository fails", async () => {
    await expect(
      loadModelHistory("model-gpt-6-1-sol", new ThrowingHistoryRepository()),
    ).resolves.toEqual({ status: "unavailable", records: [], changes: [] });
  });
});