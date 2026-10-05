import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadProviderDetail } from "@/features/providers/load-provider-detail";
import { ProviderDetailView } from "@/features/providers/provider-detail";
import { createPricingRepository } from "@/infrastructure/repositories/create-pricing-repository";

export const revalidate = 3600;

interface ProviderPageProps {
  params: Promise<{ providerSlug: string }>;
}

export async function generateStaticParams() {
  const providers = await createPricingRepository().listProviders();
  return providers.map((provider) => ({ providerSlug: provider.slug }));
}

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const { providerSlug } = await params;
  const detail = await loadProviderDetail(providerSlug);
  if (!detail) return { title: "Provider not found" };

  const pricedCount = detail.models.filter(({ pricing }) => pricing !== null).length;
  return {
    title: `${detail.provider.name} AI API pricing`,
    description: `${detail.provider.name} AI API pricing with ${pricedCount} priced models, official source links, and verification dates.`,
  };
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { providerSlug } = await params;
  const detail = await loadProviderDetail(providerSlug);
  if (!detail) notFound();

  return <ProviderDetailView detail={detail} />;
}