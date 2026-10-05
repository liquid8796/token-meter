import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";

import type {
  ModelFilter,
  PricingRepository,
} from "@/application/ports/pricing-repository";
import type {
  AiModel,
  ModelPricing,
  ModelStatus,
  Provider,
} from "@/domain/pricing/types";
import type { TokenMeterDatabase } from "@/infrastructure/db/client";
import {
  modelPricing,
  models,
  pricingBands,
  providers,
} from "@/infrastructure/db/schema";
import { hydrateModelPricing } from "./postgres-row-mappers";

function mapModel(row: typeof models.$inferSelect): AiModel {
  return {
    id: row.id,
    providerId: row.providerId,
    slug: row.slug,
    apiModelId: row.apiModelId,
    name: row.name,
    family: row.family,
    description: row.description,
    contextWindowTokens: row.contextWindowTokens
      ? BigInt(row.contextWindowTokens)
      : null,
    maxOutputTokens: row.maxOutputTokens ? BigInt(row.maxOutputTokens) : null,
    modalities: row.modalities,
    status: row.status as ModelStatus,
    releasedAt: row.releasedAt,
  };
}

function mapProvider(row: typeof providers.$inferSelect): Provider {
  return { ...row };
}

export class PostgresPricingRepository implements PricingRepository {
  constructor(private readonly db: TokenMeterDatabase) {}

  async listProviders(): Promise<Provider[]> {
    const rows = await this.db
      .select()
      .from(providers)
      .where(eq(providers.isActive, true))
      .orderBy(providers.name);

    return rows.map(mapProvider);
  }

  async listModels(filter: ModelFilter = {}): Promise<AiModel[]> {
    const conditions = [];

    if (filter.providerId) {
      conditions.push(eq(models.providerId, filter.providerId));
    }

    if (filter.status) {
      conditions.push(eq(models.status, filter.status));
    }

    const rows = await this.db
      .select()
      .from(models)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(models.name);

    return rows.map(mapModel);
  }

  async getModelBySlug(slug: string): Promise<AiModel | null> {
    const [row] = await this.db
      .select()
      .from(models)
      .where(eq(models.slug, slug))
      .limit(1);

    return row ? mapModel(row) : null;
  }

  async getProviderBySlug(slug: string): Promise<Provider | null> {
    const [row] = await this.db
      .select()
      .from(providers)
      .where(eq(providers.slug, slug))
      .limit(1);

    return row ? mapProvider(row) : null;
  }

  async getCurrentPricing(
    modelId: string,
    asOf = new Date(),
  ): Promise<ModelPricing | null> {
    const [pricingRow] = await this.db
      .select()
      .from(modelPricing)
      .where(
        and(
          eq(modelPricing.modelId, modelId),
          lte(modelPricing.effectiveFrom, asOf),
          or(isNull(modelPricing.effectiveTo), gte(modelPricing.effectiveTo, asOf)),
        ),
      )
      .orderBy(desc(modelPricing.effectiveFrom))
      .limit(1);

    if (!pricingRow) {
      return null;
    }

    const bandRows = await this.db
      .select()
      .from(pricingBands)
      .where(eq(pricingBands.pricingId, pricingRow.id));

    return hydrateModelPricing(pricingRow, bandRows);
  }
}
