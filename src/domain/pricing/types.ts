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
