import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { PRICING_SNAPSHOT } from "@/data/pricing-snapshot";
import type { TokenMeterDatabase } from "@/infrastructure/db/client";
import { buildSeedRows } from "@/infrastructure/db/seed-rows";
import * as schema from "@/infrastructure/db/schema";
import { PostgresPricingHistoryRepository } from "./postgres-pricing-history-repository";

describe("PostgresPricingHistoryRepository", () => {
  let client: PGlite;
  let repository: PostgresPricingHistoryRepository;

  beforeAll(async () => {
    client = new PGlite();
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: "drizzle" });

    const rows = buildSeedRows(PRICING_SNAPSHOT);
    await db.insert(schema.providers).values(rows.providers);
    await db.insert(schema.models).values(rows.models);
    await db.insert(schema.modelPricing).values(rows.pricing);
    await db.insert(schema.pricingBands).values(rows.bands);

    repository = new PostgresPricingHistoryRepository(
      db as unknown as TokenMeterDatabase,
    );
  });

  afterAll(async () => {
    await client.close();
  });

  it("returns model pricing history oldest to newest with effective-date basis", async () => {
    const history = await repository.listPricingHistory("model-gemini-3-8-flash");

    expect(history.map((pricing) => pricing.id)).toEqual([
      "price-gemini-3-8-flash-intro-2026",
      "price-gemini-3-8-flash-2027",
    ]);
    expect(history.map((pricing) => pricing.effectiveFromBasis)).toEqual([
      "verified",
      "official",
    ]);
    expect(history[0].bands[0].inputPerUnit).toBe("0.750000000000");
    expect(history[1].bands[0].inputPerUnit).toBe("1.500000000000");
  });

  it("returns an empty list when a model has no pricing history", async () => {
    await expect(repository.listPricingHistory("missing-model")).resolves.toEqual([]);
  });
});