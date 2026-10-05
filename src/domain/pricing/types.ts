export type MoneyValue = string;

export interface PricingBand {
  unitTokens: bigint;
  minInputTokensPerRequest: bigint;
  maxInputTokensPerRequest: bigint | null;
  inputPerUnit?: MoneyValue;
  outputPerUnit?: MoneyValue;
  cachedInputPerUnit?: MoneyValue;
  cacheWritePerUnit?: MoneyValue;
  batchInputPerUnit?: MoneyValue;
  batchOutputPerUnit?: MoneyValue;
}

export interface SelectedPricingBand {
  band: PricingBand;
  assumption: "base-band" | null;
}

export interface Workload {
  inputTokens: bigint;
  outputTokens: bigint;
  cachedInputTokens: bigint;
}

export interface CostBreakdown {
  inputCost: MoneyValue;
  outputCost: MoneyValue;
  cachedInputCost: MoneyValue | null;
  totalCost: MoneyValue;
}

export type ModelStatus = "active" | "legacy" | "preview" | "deprecated";

export interface Provider {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  pricingUrl: string;
  isActive: boolean;
}

export interface AiModel {
  id: string;
  providerId: string;
  slug: string;
  apiModelId: string;
  name: string;
  family: string | null;
  description: string;
  contextWindowTokens: bigint | null;
  maxOutputTokens: bigint | null;
  modalities: string[];
  status: ModelStatus;
  releasedAt: string | null;
}

export interface ModelPricing {
  id: string;
  modelId: string;
  currency: "USD";
  bands: PricingBand[];
  effectiveFrom: string;
  effectiveFromBasis: "verified" | "official";
  effectiveTo: string | null;
  sourceUrl: string;
  verifiedAt: string;
  notes: string | null;
}

export interface PricingSnapshot {
  providers: Provider[];
  models: AiModel[];
  pricing: ModelPricing[];
}
