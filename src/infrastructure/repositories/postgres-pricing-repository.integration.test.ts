import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { PRICING_SNAPSHOT } from "@/data/pricing-snapshot";
import type { TokenMeterDatabase } from "@/infrastructure/db/client";
import { buildSeedRows } from "@/infrastructure/db/seed-rows";
import * as schema from "@/infrastructure/db/schema";
import { PostgresPricingRepository } from "./postgres-pricing-repository";

describe("PostgresPricingRepository", () => {
  let client: PGlite;
  let repository: PostgresPricingRepository;

  beforeAll(async () => {
    client = new PGlite();
    const pgliteDb = drizzle(client, { schema });
    await migrate(pgliteDb, { migrationsFolder: "drizzle" });

    const rows = buildSeedRows(PRICING_SNAPSHOT);
    await pgliteDb.insert(schema.providers).values(rows.providers);
    await pgliteDb.insert(schema.models).values(rows.models);
    await pgliteDb.insert(schema.modelPricing).values(rows.pricing);
    await pgliteDb.insert(schema.pricingBands).values(rows.bands);

    repository = new PostgresPricingRepository(
      pgliteDb as unknown as TokenMeterDatabase,
    );
  });

  afterAll(async () => {
    await client.close();
  });

  it("reads providers and filtered models from migrated PostgreSQL tables", async () => {
    const providers = await repository.listProviders();
    const google = providers.find((provider) => provider.slug === "google");
    const activeGoogleModels = await repository.listModels({
      providerId: google!.id,
      status: "active",
    });

    expect(providers).toHaveLength(3);
    expect(activeGoogleModels.map((model) => model.slug)).toEqual([
      "gemini-3.8-flash",
    ]);
  });

  it("hydrates current pricing and switches to future effective pricing", async () => {
    const model = await repository.getModelBySlug("gemini-3.8-flash");

    const current = await repository.getCurrentPricing(
      model!.id,
      new Date("2026-10-05T12:00:00.000Z"),
    );
    const future = await repository.getCurrentPricing(
      model!.id,
      new Date("2027-01-02T00:00:00.000Z"),
    );

    expect(current?.bands[0].inputPerUnit).toBe("0.750000000000");
    expect(current?.bands[0].outputPerUnit).toBe("3.750000000000");
    expect(future?.bands[0].inputPerUnit).toBe("1.500000000000");
    expect(future?.bands[0].outputPerUnit).toBe("7.500000000000");
  });

  it("returns null for unknown slugs and dates without effective pricing", async () => {
    await expect(repository.getModelBySlug("missing-model")).resolves.toBeNull();
    await expect(repository.getProviderBySlug("missing-provider")).resolves.toBeNull();

    const model = await repository.getModelBySlug("gpt-6-astra");
    await expect(
      repository.getCurrentPricing(model!.id, new Date("2026-01-01T00:00:00.000Z")),
    ).resolves.toBeNull();
  });
});
