import type { Metadata } from "next";

import { ContentPage } from "@/components/content-page";
import { createCanonicalMetadata } from "@/features/seo/metadata";

export const metadata: Metadata = createCanonicalMetadata({
  title: "Privacy",
  description: "TokenMeter privacy information for calculator inputs and site operations.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Privacy"
      title="Privacy by design"
      description="The cost calculator runs its workload arithmetic in your browser after the page receives public pricing data. Calculator token counts do not need to be sent to an API for each edit."
    >
      <section className="prose-grid prose-grid-three" aria-label="Privacy details">
        <article><span className="section-index">01</span><h2>Calculator inputs</h2><p>Workload values are local UI state. Do not enter API keys, prompts, customer content, or other secrets; the calculator only needs aggregate token quantities.</p></article>
        <article><span className="section-index">02</span><h2>Operational logs</h2><p>The hosting stack may retain standard request logs for reliability and security. Those logs should not contain calculator token values because edits are calculated client-side.</p></article>
        <article><span className="section-index">03</span><h2>Advertising</h2><p>Reserved ad inventory is visually separated from calculator results. Any future advertising or analytics integration should be documented here before activation.</p></article>
      </section>
    </ContentPage>
  );
}
