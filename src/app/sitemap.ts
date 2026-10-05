import type { MetadataRoute } from "next";

import { siteUrl } from "@/features/seo/metadata";
import { createPricingRepository } from "@/infrastructure/repositories/create-pricing-repository";

const DURABLE_PATHS = [
  "/",
  "/models",
  "/compare",
  "/budget",
  "/changes",
  "/about",
  "/privacy",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repository = createPricingRepository();
  const [models, providers] = await Promise.all([
    repository.listModels(),
    repository.listProviders(),
  ]);
  const paths = [
    ...DURABLE_PATHS,
    ...models.map((model) => `/models/${model.slug}`),
    ...providers.map((provider) => `/providers/${provider.slug}`),
  ];

  return [...new Set(paths)].sort().map((path) => ({
    url: siteUrl(path),
    changeFrequency: path === "/changes" ? "daily" : "weekly",
  }));
}
