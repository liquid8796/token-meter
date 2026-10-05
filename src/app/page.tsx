import type { Metadata } from "next";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Calculator } from "@/features/calculator/calculator";
import { loadCalculatorModels } from "@/features/calculator/load-calculator-models";
import { createCanonicalMetadata } from "@/features/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = createCanonicalMetadata({
  title: "AI API cost calculator",
  description: "Compare source-backed AI model pricing against the workload you actually plan to run.",
  path: "/",
});

export default async function HomePage() {
  const models = await loadCalculatorModels();
  const providerCount = new Set(models.map((model) => model.provider)).size;
  const verifiedAt = models[0]?.verifiedAt;
  const initialSelection = [
    "gpt-6.1-sol",
    "claude-sonnet-5-5",
    "gemini-3.8-flash",
  ].filter((slug) => models.some((model) => model.slug === slug));

  return (
    <div className="site-frame">
      <div className="page-shell">
        <SiteHeader />
        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="hero-kicker">
                <span className="signal-dot" /> Source-backed API pricing
              </p>
              <h1>Price your AI workload before it reaches production.</h1>
              <p className="hero-deck">
                Compare current token costs across leading models, including cache and
                long-context pricing, with the assumptions kept visible.
              </p>
            </div>
            <dl className="hero-readout" aria-label="Pricing dataset status">
              <div>
                <dt>Models</dt>
                <dd>{models.length.toString().padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>Providers</dt>
                <dd>{providerCount.toString().padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>Verified</dt>
                <dd>
                  {verifiedAt
                    ? new Date(verifiedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section
            id="calculator"
            className="calculator-section"
            aria-label="AI API cost calculator"
          >
            <div className="section-rule">
              <span>Workload instrument</span>
              <span>USD · per 1M tokens where applicable</span>
            </div>
            <Calculator models={models} initialSelectedSlugs={initialSelection} />
          </section>

          <AdSlot />

          <section className="method-strip">
            <div>
              <span className="section-index">03</span>
              <h2>Numbers you can trace.</h2>
            </div>
            <p>
              Every shipped rate points back to official provider pricing and carries a
              verification date. TokenMeter does not silently invent discounts, regional
              routing, storage fees, or request patterns you did not specify.
            </p>
            <Link href="/about">
              Read the methodology <span aria-hidden="true">→</span>
            </Link>
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
