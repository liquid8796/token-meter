import { inArray } from "drizzle-orm";

import { PRICING_SNAPSHOT } from "@/data/pricing-snapshot";
import { closeDatabaseConnection, getDatabaseConnection } from "./client";
import { buildSeedRows } from "./seed-rows";
import { modelPricing, models, pricingBands, providers } from "./schema";

const rows = buildSeedRows(PRICING_SNAPSHOT);
const { db } = getDatabaseConnection();

try {
  await db.transaction(async (tx) => {
    for (const provider of rows.providers) {
      await tx
        .insert(providers)
        .values(provider)
        .onConflictDoUpdate({ target: providers.id, set: provider });
    }

    for (const model of rows.models) {
      await tx
        .insert(models)
        .values(model)
        .onConflictDoUpdate({ target: models.id, set: model });
    }

    for (const pricing of rows.pricing) {
      await tx
        .insert(modelPricing)
        .values(pricing)
        .onConflictDoUpdate({ target: modelPricing.id, set: pricing });
    }

    const pricingIds = rows.pricing.map((pricing) => pricing.id);
    await tx.delete(pricingBands).where(inArray(pricingBands.pricingId, pricingIds));
    await tx.insert(pricingBands).values(rows.bands);
  });

  console.log(
    `TokenMeter seed applied: ${rows.providers.length} providers, ${rows.models.length} models, ${rows.pricing.length} pricing records.`,
  );
} finally {
  await closeDatabaseConnection();
}
