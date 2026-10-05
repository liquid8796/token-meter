import type { Metadata } from "next";

import { ContentPage } from "@/components/content-page";
import { Calculator } from "@/features/calculator/calculator";
import { loadCalculatorModels } from "@/features/calculator/load-calculator-models";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Compare AI model costs",
  description: "Compare source-backed AI API prices against the same monthly workload.",
};

export default async function ComparePage() {
  const models = await loadCalculatorModels();

  return (
    <ContentPage
      eyebrow="Side-by-side cost instrument"
      title="Compare AI model costs"
      description="Run one workload through up to four models. TokenMeter applies each provider's current cache and context-band rules before ranking the result."
    >
      <section className="standalone-calculator" aria-label="AI model cost comparison">
        <div className="section-rule"><span>Comparison workload</span><span>Up to 4 models</span></div>
        <Calculator models={models} initialSelectedSlugs={models.slice(0, 4).map((model) => model.slug)} />
      </section>
    </ContentPage>
  );
}
