import type { PricingHistoryRepository } from "@/application/ports/pricing-history-repository";
import {
  getDatabaseConnection,
  isDatabaseConfigured,
} from "@/infrastructure/db/client";
import { PostgresPricingHistoryRepository } from "./postgres-pricing-history-repository";

export function createPricingHistoryRepository(): PricingHistoryRepository | null {
  if (!isDatabaseConfigured()) {
    return null;
  }

  return new PostgresPricingHistoryRepository(getDatabaseConnection().db);
}