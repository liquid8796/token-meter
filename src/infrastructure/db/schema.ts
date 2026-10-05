import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const providers = pgTable(
  "providers",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    websiteUrl: text("website_url").notNull(),
    pricingUrl: text("pricing_url").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [uniqueIndex("providers_slug_unique").on(table.slug)],
);

export const models = pgTable(
  "models",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    apiModelId: text("api_model_id").notNull(),
    name: text("name").notNull(),
    family: text("family"),
    description: text("description").notNull(),
    contextWindowTokens: numeric("context_window_tokens", {
      precision: 30,
      scale: 0,
    }),
    maxOutputTokens: numeric("max_output_tokens", { precision: 30, scale: 0 }),
    modalities: jsonb("modalities").$type<string[]>().notNull(),
    status: text("status").notNull(),
    releasedAt: date("released_at"),
  },
  (table) => [
    uniqueIndex("models_slug_unique").on(table.slug),
    uniqueIndex("models_provider_api_model_unique").on(
      table.providerId,
      table.apiModelId,
    ),
    index("models_provider_idx").on(table.providerId),
    index("models_status_idx").on(table.status),
  ],
);

export const modelPricing = pgTable(
  "model_pricing",
  {
    id: text("id").primaryKey(),
    modelId: text("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    sourceUrl: text("source_url").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("model_pricing_model_effective_idx").on(
      table.modelId,
      table.effectiveFrom,
    ),
    uniqueIndex("model_pricing_one_open_ended_per_currency")
      .on(table.modelId, table.currency)
      .where(sql`${table.effectiveTo} is null`),
  ],
);

export const pricingBands = pgTable(
  "pricing_bands",
  {
    id: text("id").primaryKey(),
    pricingId: text("pricing_id")
      .notNull()
      .references(() => modelPricing.id, { onDelete: "cascade" }),
    unitTokens: numeric("unit_tokens", { precision: 30, scale: 0 }).notNull(),
    minInputTokensPerRequest: numeric("min_input_tokens_per_request", {
      precision: 30,
      scale: 0,
    }).notNull(),
    maxInputTokensPerRequest: numeric("max_input_tokens_per_request", {
      precision: 30,
      scale: 0,
    }),
    inputPerUnit: numeric("input_per_unit", { precision: 30, scale: 12 }),
    outputPerUnit: numeric("output_per_unit", { precision: 30, scale: 12 }),
    cachedInputPerUnit: numeric("cached_input_per_unit", {
      precision: 30,
      scale: 12,
    }),
    cacheWritePerUnit: numeric("cache_write_per_unit", {
      precision: 30,
      scale: 12,
    }),
    batchInputPerUnit: numeric("batch_input_per_unit", {
      precision: 30,
      scale: 12,
    }),
    batchOutputPerUnit: numeric("batch_output_per_unit", {
      precision: 30,
      scale: 12,
    }),
  },
  (table) => [
    index("pricing_bands_pricing_idx").on(table.pricingId),
    uniqueIndex("pricing_bands_floor_unique").on(
      table.pricingId,
      table.minInputTokensPerRequest,
    ),
  ],
);
