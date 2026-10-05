import { asc, eq, inArray } from "drizzle-orm";

import type { PricingHistoryRepository } from "@/application/ports/pricing-history-repository";
import type { ModelPricing } from "@/domain/pricing/types";
import type { TokenMeterDatabase } from "@/infrastructure/db/client";
import { modelPricing, pricingBands } from "@/infrastructure/db/schema";
import { hydrateModelPricing } from "./postgres-row-mappers";

export class PostgresPricingHistoryRepository implements PricingHistoryRepository {
  constructor(private readonly db: TokenMeterDatabase) {}

  async listPricingHistory(modelId: string): Promise<ModelPricing[]> {
    const pricingRows = await this.db
      .select()
      .from(modelPricing)
      .where(eq(modelPricing.modelId, modelId))
      .orderBy(asc(modelPricing.effectiveFrom), asc(modelPricing.id));

    if (pricingRows.length === 0) {
      return [];
    }

    const ids = pricingRows.map((row) => row.id);
    const bandRows = await this.db
      .select()
      .from(pricingBands)
      .where(inArray(pricingBands.pricingId, ids));
    const bandsByPricing = new Map<string, typeof bandRows>();

    for (const row of bandRows) {
      const rows = bandsByPricing.get(row.pricingId) ?? [];
      rows.push(row);
      bandsByPricing.set(row.pricingId, rows);
    }

    return pricingRows.map((row) =>
      hydrateModelPricing(row, bandsByPricing.get(row.id) ?? []),
    );
  }
}