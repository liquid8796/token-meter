import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadCalculatorModels } from "@/features/calculator/load-calculator-models";
import { loadModelDetail } from "@/features/models/load-model-detail";
import { ModelDetailView } from "@/features/models/model-detail";
import { createCanonicalMetadata, siteUrl } from "@/features/seo/metadata";
import { createPricingRepository } from "@/infrastructure/repositories/create-pricing-repository";

export const revalidate = 3600;

interface ModelPageProps {
  params: Promise<{ modelSlug: string }>;
}

export async function generateStaticParams() {
  const models = await createPricingRepository().listModels();
  return models.map((model) => ({ modelSlug: model.slug }));
}

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { modelSlug } = await params;
  const detail = await loadModelDetail(modelSlug);
  if (!detail) return { title: "Model not found" };

  return createCanonicalMetadata({
    title: `${detail.model.name} API pricing`,
    description: `${detail.model.name} pricing from ${detail.provider.name}, with source-backed token rates, context limits, and verification date.`,
    path: `/models/${detail.model.slug}`,
    keywords: [
      `${detail.model.name} pricing`,
      `${detail.model.name} API cost`,
      `${detail.provider.name} token cost`,
      "LLM API pricing",
      "token cost calculator",
    ],
  });
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { modelSlug } = await params;
  const [detail, calculatorModels] = await Promise.all([
    loadModelDetail(modelSlug),
    loadCalculatorModels(),
  ]);

  if (!detail) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Models",
        item: siteUrl("/models"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: detail.model.name,
        item: siteUrl(`/models/${detail.model.slug}`),
      },
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${detail.model.name} API`,
    description: `${detail.model.name} pricing from ${detail.provider.name}`,
    category: "AI Language Model API",
    brand: {
      "@type": "Brand",
      name: detail.provider.name,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ModelDetailView detail={detail} calculatorModels={calculatorModels} />
    </>
  );
}