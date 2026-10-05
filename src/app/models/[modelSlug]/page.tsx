import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadCalculatorModels } from "@/features/calculator/load-calculator-models";
import { loadModelDetail } from "@/features/models/load-model-detail";
import { ModelDetailView } from "@/features/models/model-detail";
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

  return {
    title: `${detail.model.name} API pricing`,
    description: `${detail.model.name} pricing from ${detail.provider.name}, with source-backed token rates, context limits, and verification date.`,
  };
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { modelSlug } = await params;
  const [detail, calculatorModels] = await Promise.all([
    loadModelDetail(modelSlug),
    loadCalculatorModels(),
  ]);

  if (!detail) notFound();

  return <ModelDetailView detail={detail} calculatorModels={calculatorModels} />;
}