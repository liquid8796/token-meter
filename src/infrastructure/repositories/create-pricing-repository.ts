import type { PricingRepository } from "@/application/ports/pricing-repository";
import { PRICING_SNAPSHOT } from "@/data/pricing-snapshot";
import {
  getDatabaseConnection,
  isDatabaseConfigured,
} from "@/infrastructure/db/client";
import { PostgresPricingRepository } from "./postgres-pricing-repository";
import { ResilientPricingRepository } from "./resilient-pricing-repository";
import { SnapshotPricingRepository } from "./snapshot-pricing-repository";

let repository: PricingRepository | null = null;

export function createPricingRepository(): PricingRepository {
  if (repository) {
    return repository;
  }

  const snapshot = new SnapshotPricingRepository(PRICING_SNAPSHOT);

  if (!isDatabaseConfigured()) {
    repository = snapshot;
    return repository;
  }

  const postgresRepository = new PostgresPricingRepository(
    getDatabaseConnection().db,
  );
  repository = new ResilientPricingRepository(postgresRepository, snapshot);
  return repository;
}
