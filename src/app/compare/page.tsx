import type { Metadata } from "next";

import { ContentPage } from "@/components/content-page";
import { loadCalculatorModels } from "@/features/calculator/load-calculator-models";
import { CompareClient } from "@/features/compare/compare-client";
import {
  comparisonSearchParamsFromRecord,
  parseComparisonSearchParams,
} from "@/features/compare/comparison-state";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Compare AI model costs",
  description: "Compare source-backed AI API prices against the same monthly workload.",
  alternates: { canonical: "/compare" },
};

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

  return (
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
  );
}
