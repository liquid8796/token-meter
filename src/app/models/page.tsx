import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage } from "@/components/content-page";
import { formatUsd } from "@/domain/pricing/format";
import { loadCalculatorModels } from "@/features/calculator/load-calculator-models";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AI model pricing catalogue",
  description: "Browse source-backed AI model token prices, context limits, and verification dates.",
};

function formatTokens(value: string | null) {
  if (!value) return "Not published";
  const amount = Number(value);
  if (amount >= 1_000_000) return `${amount / 1_000_000}M`;
  if (amount >= 1_000) return `${amount / 1_000}K`;
  return value;
}

export default async function ModelsPage() {
  const models = await loadCalculatorModels();

  return (
    <ContentPage
      eyebrow="Current model index"
      title="Model pricing catalogue"
      description="A compact reference for the rates TokenMeter currently uses. Every row keeps the official pricing source and verification date attached."
    >
      <section className="catalogue" aria-label="AI model prices">
        <div className="section-rule">
          <span>{models.length.toString().padStart(2, "0")} priced models</span>
          <span>USD · provider-published rates</span>
        </div>
        <div className="catalogue-grid">
          {models.map((model) => {
            const baseBand = model.bands[0];
            return (
              <article className="catalogue-row" key={model.slug}>
                <div className="catalogue-identity">
                  {model.providerSlug ? (
                    <Link href={`/providers/${model.providerSlug}`} aria-label={`${model.provider} provider pricing`} className="catalogue-provider-link">
                      {model.provider}
                    </Link>
                  ) : (
                    <span>{model.provider}</span>
                  )}
                  <h2><Link href={`/models/${model.slug}`}>{model.name}</Link></h2>
                  <code>{model.slug}</code>
                </div>
                <dl className="catalogue-metrics">
                  <div><dt>Input / unit</dt><dd>{baseBand.inputPerUnit ? formatUsd(baseBand.inputPerUnit) : "—"}</dd></div>
                  <div><dt>Output / unit</dt><dd>{baseBand.outputPerUnit ? formatUsd(baseBand.outputPerUnit) : "—"}</dd></div>
                  <div><dt>Cache read</dt><dd>{baseBand.cachedInputPerUnit ? formatUsd(baseBand.cachedInputPerUnit) : "—"}</dd></div>
                  <div><dt>Context</dt><dd>{formatTokens(model.contextWindowTokens)}</dd></div>
                </dl>
                <div className="catalogue-source">
                  <span>{model.bands.length > 1 ? `${model.bands.length} context bands` : "Flat rate"}</span>
                  <a href={model.sourceUrl} target="_blank" rel="noreferrer">Official source ↗</a>
                  <small>Verified {new Date(model.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</small>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </ContentPage>
  );
}
