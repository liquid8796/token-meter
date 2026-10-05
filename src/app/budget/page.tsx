import type { Metadata } from "next";

import { ContentPage } from "@/components/content-page";
import { BudgetCalculator } from "@/features/budget/budget-calculator";
import { loadBudgetModels } from "@/features/budget/load-budget-models";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AI API budget calculator",
  description: "Estimate how many AI API tokens or requests fit inside a monthly budget using source-backed provider pricing.",
  alternates: { canonical: "/budget" },
};

export default async function BudgetPage() {
  const models = await loadBudgetModels();

  return (
    <ContentPage
      eyebrow="Budget capacity instrument"
      title="Turn a monthly AI budget into usable capacity"
      description="Choose a source-backed model, enter a representative token mix or request shape, and TokenMeter calculates the bounded capacity your monthly budget can support."
    >
      <section className="standalone-calculator" aria-label="AI API budget calculator">
        <div className="section-rule"><span>Budget planning</span><span>Source-backed rates</span></div>
        <BudgetCalculator models={models} />
      </section>
    </ContentPage>
  );
}
