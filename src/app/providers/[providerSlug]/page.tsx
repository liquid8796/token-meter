import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadProviderDetail } from "@/features/providers/load-provider-detail";
import { ProviderDetailView } from "@/features/providers/provider-detail";
import { createCanonicalMetadata, siteUrl } from "@/features/seo/metadata";
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
  return createCanonicalMetadata({
    title: `${detail.provider.name} AI API pricing`,
    description: `${detail.provider.name} AI API pricing with ${pricedCount} priced models, official source links, and verification dates.`,
    path: `/providers/${detail.provider.slug}`,
    keywords: [
      `${detail.provider.name} AI pricing`,
      `${detail.provider.name} model costs`,
      `${detail.provider.name} API rates`,
      "LLM token price comparison",
    ],
  });
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { providerSlug } = await params;
  const detail = await loadProviderDetail(providerSlug);
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
        name: detail.provider.name,
        item: siteUrl(`/providers/${detail.provider.slug}`),
      },
    ],
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: detail.provider.name,
    url: detail.models[0]?.pricing?.sourceUrl || siteUrl(`/providers/${detail.provider.slug}`),
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
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ProviderDetailView detail={detail} />
    </>
  );
}