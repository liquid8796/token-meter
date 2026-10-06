import type { Metadata } from "next";

import { ContentPage } from "@/components/content-page";
import { loadCalculatorModels } from "@/features/calculator/load-calculator-models";
import { CompareClient } from "@/features/compare/compare-client";
import { createCanonicalMetadata, siteUrl } from "@/features/seo/metadata";
import {
  comparisonSearchParamsFromRecord,
  parseComparisonSearchParams,
} from "@/features/compare/comparison-state";

export const revalidate = 3600;

export const metadata: Metadata = createCanonicalMetadata({
  title: "Compare AI model costs",
  description: "Compare source-backed AI API prices side-by-side against the same monthly workload. Supports OpenAI, Anthropic, and Google models.",
  path: "/compare",
  keywords: [
    "compare AI model costs",
    "LLM price comparison",
    "OpenAI vs Claude pricing",
    "GPT-6 vs Claude Sonnet vs Gemini",
    "AI token cost compare",
  ],
});

type CompareSearchParams = Record<string, string | string[] | undefined>;

interface ComparePageProps {
  searchParams?: Promise<CompareSearchParams>;
}

export default async function ComparePage({
  searchParams = Promise.resolve({}),
}: ComparePageProps = {}) {
  const models = await loadCalculatorModels();
  const rawSearchParams = await searchParams;
  const parsedScenario = parseComparisonSearchParams(
    comparisonSearchParamsFromRecord(rawSearchParams),
    models.map((model) => model.slug),
  );
  const initialScenario = parsedScenario.modelSlugs.length > 0
    ? parsedScenario
    : { ...parsedScenario, modelSlugs: models.slice(0, 4).map((model) => model.slug) };

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
        name: "Compare",
        item: siteUrl("/compare"),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ContentPage
        eyebrow="Side-by-side cost instrument"
        title="Compare AI model costs"
        description="Run one workload through up to four models. TokenMeter applies each provider's current cache and context-band rules before ranking the result."
      >
        <section className="standalone-calculator" aria-label="AI model cost comparison">
          <div className="section-rule"><span>Comparison workload</span><span>Up to 4 models</span></div>
          <CompareClient models={models} initialScenario={initialScenario} />
        </section>
      </ContentPage>
    </>
  );
}
