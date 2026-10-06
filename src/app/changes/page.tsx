import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage } from "@/components/content-page";
import { loadPriceChanges } from "@/features/history/load-price-changes";
import { PriceChangeLedger } from "@/features/history/price-change-ledger";
import { createCanonicalMetadata, siteUrl } from "@/features/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = createCanonicalMetadata({
  title: "AI pricing change ledger",
  description: "Track source-backed numeric AI API price changes with verified or official effective-date semantics.",
  path: "/changes",
  keywords: [
    "AI pricing change ledger",
    "LLM price history",
    "OpenAI price drop",
    "Claude price changes",
    "Gemini pricing updates",
  ],
});

export default async function ChangesPage() {
  const state = await loadPriceChanges({ limit: 50 });

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
        name: "Changes",
        item: siteUrl("/changes"),
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
        eyebrow="Source-backed pricing history"
        title="Pricing change ledger"
        description="Verified numeric rate changes only. Metadata-only edits and unchanged re-verifications are excluded by the pricing history domain rules."
      >
        <section className="changes-sheet" aria-label="Verified numeric rate changes">
          <div className="section-rule">
            <span>Chronological rate tape</span>
            <span>Newest first · up to 50 events</span>
          </div>
          <PriceChangeLedger state={state} />
        </section>

        <nav className="discovery-links" aria-label="Pricing discovery tools">
          <Link href="/models">Browse current models</Link>
          <Link href="/compare">Compare a workload</Link>
          <Link href="/budget">Plan by budget</Link>
        </nav>
      </ContentPage>
    </>
  );
}
