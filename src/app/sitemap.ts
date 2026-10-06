import type { MetadataRoute } from "next";

import { siteUrl } from "@/features/seo/metadata";
import { createPricingRepository } from "@/infrastructure/repositories/create-pricing-repository";

function getPathPriority(path: string): number {
  if (path === "/") return 1.0;
  if (path === "/models" || path === "/compare" || path === "/budget") return 0.9;
  if (path.startsWith("/models/")) return 0.8;
  if (path === "/changes") return 0.8;
  if (path.startsWith("/providers/")) return 0.7;
  if (path === "/about") return 0.5;
  if (path === "/privacy") return 0.3;
  return 0.6;
}

function getChangeFrequency(path: string): "daily" | "weekly" | "monthly" {
  if (path === "/" || path === "/compare" || path === "/models" || path === "/changes" || path === "/budget") {
    return "daily";
  }
  if (path.startsWith("/models/") || path.startsWith("/providers/")) {
    return "weekly";
  }
  return "monthly";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repository = createPricingRepository();
  const [models, providers] = await Promise.all([
    repository.listModels(),
    repository.listProviders(),
  ]);

  const durablePaths = [
    "/",
    "/models",
    "/compare",
    "/budget",
    "/changes",
    "/about",
    "/privacy",
  ] as const;

  const paths = [
    ...durablePaths,
    ...models.map((model) => `/models/${model.slug}`),
    ...providers.map((provider) => `/providers/${provider.slug}`),
  ];

  const now = new Date();

  return [...new Set(paths)].sort().map((path) => ({
    url: siteUrl(path),
    changeFrequency: getChangeFrequency(path),
    priority: getPathPriority(path),
    lastModified: now,
  }));
}
