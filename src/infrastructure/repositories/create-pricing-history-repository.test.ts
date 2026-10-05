import { describe, expect, it } from "vitest";

import { createPricingHistoryRepository } from "./create-pricing-history-repository";

describe("createPricingHistoryRepository", () => {
  it("returns null when PostgreSQL is not configured instead of fabricating snapshot history", () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      expect(createPricingHistoryRepository()).toBeNull();
    } finally {
      if (original) process.env.DATABASE_URL = original;
    }
  });
});