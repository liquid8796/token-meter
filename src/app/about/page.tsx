import type { Metadata } from "next";

import { ContentPage } from "@/components/content-page";
import { createCanonicalMetadata, siteUrl } from "@/features/seo/metadata";

export const metadata: Metadata = createCanonicalMetadata({
  title: "Methodology",
  description: "How TokenMeter sources rates and turns token workloads into comparable AI API estimates.",
  path: "/about",
  keywords: [
    "TokenMeter methodology",
    "AI pricing accuracy",
    "token cost calculation formula",
    "LLM pricing benchmark",
  ],
});

const principles = [
  ["01", "Official sources first", "Rates are curated from provider-owned pricing or model documentation and retain a source URL plus verification date."],
  ["02", "Integer token quantities", "Token counts are parsed as integers, including K/M/B shorthand, before Decimal arithmetic is used for currency calculations."],
  ["03", "Context rules stay visible", "When a provider charges more above a request-context threshold, the average input tokens per request selects the matching pricing band."],
  ["04", "Fallback without fabrication", "If the database is unavailable, public reads fall back to the last trusted snapshot instead of inventing or extrapolating rates."],
];

export default function AboutPage() {
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
        name: "Methodology",
        item: siteUrl("/about"),
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
        eyebrow="Methodology"
        title="How TokenMeter estimates cost"
        description="The calculator is deliberately simple: provider rates in, explicit workload assumptions in, decimal-safe arithmetic out. No hidden quality score or synthetic benchmark is mixed into the price."
      >
        <section className="prose-grid" aria-label="Calculation methodology">
          {principles.map(([index, title, copy]) => (
            <article key={index}>
              <span className="section-index">{index}</span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </section>
      </ContentPage>
    </>
  );
}
