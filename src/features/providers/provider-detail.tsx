import Link from "next/link";

import { ContentPage } from "@/components/content-page";
import { formatUsd } from "@/domain/pricing/format";
import type { ProviderDetail } from "./load-provider-detail";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProviderDetailView({ detail }: { detail: ProviderDetail }) {
  const modelNames = new Map(detail.models.map(({ model }) => [model.id, model.name]));

  return (
    <ContentPage
      eyebrow="Provider pricing index"
      title={`${detail.provider.name} AI API pricing`}
      description={`Current source-backed rates for ${detail.models.length} active or preview ${detail.provider.name} models tracked by TokenMeter.`}
    >
      <section className="provider-sheet" aria-label={`${detail.provider.name} model pricing`}>
        <div className="source-strip provider-source-strip">
          <div>
            <span className="instrument-label">Official provider</span>
            <strong>{detail.provider.name}</strong>
          </div>
          <div className="source-strip-actions">
            <a href={detail.provider.websiteUrl} target="_blank" rel="noreferrer">Provider site ↗</a>
            <a href={detail.provider.pricingUrl} target="_blank" rel="noreferrer">Official pricing ↗</a>
          </div>
        </div>

        <div className="section-rule"><span>Model matrix</span><span>Current standard USD rates</span></div>
        <div className="provider-model-matrix">
          {detail.models.map(({ model, pricing }) => {
            const baseBand = pricing?.bands[0];
            return (
              <article className="provider-model-row" key={model.id}>
                <div className="provider-model-identity">
                  <span className="status-chip" data-status={model.status}>{model.status}</span>
                  <Link href={`/models/${model.slug}`} aria-label={`${model.name} details`}>
                    <strong>{model.name}</strong>
                  </Link>
                  <code>{model.apiModelId}</code>
                </div>
                <dl>
                  <div><dt>Input</dt><dd>{baseBand?.inputPerUnit ? formatUsd(baseBand.inputPerUnit) : "—"}</dd></div>
                  <div><dt>Output</dt><dd>{baseBand?.outputPerUnit ? formatUsd(baseBand.outputPerUnit) : "—"}</dd></div>
                  <div><dt>Cache</dt><dd>{baseBand?.cachedInputPerUnit ? formatUsd(baseBand.cachedInputPerUnit) : "—"}</dd></div>
                  <div><dt>Verified</dt><dd>{pricing ? formatDate(pricing.verifiedAt) : "Unavailable"}</dd></div>
                </dl>
                <div className="provider-model-actions">
                  <Link href={`/models/${model.slug}`}>Details</Link>
                  <Link href={`/compare?models=${encodeURIComponent(model.slug)}`} aria-label={`Compare ${model.name}`}>Compare ↗</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="history-sheet" aria-label="Recent provider pricing changes">
        <div className="section-rule history-rule">
          <span>Recent verified changes</span>
          <Link href="/changes">All pricing changes</Link>
        </div>
        {detail.historyStatus === "unavailable" ? (
          <p className="instrument-empty">Pricing history is temporarily unavailable; current rates above remain source-backed.</p>
        ) : detail.recentChanges.length === 0 ? (
          <p className="instrument-empty">No verified numeric price changes are recorded for this provider yet.</p>
        ) : (
          <ol className="history-ledger">
            {detail.recentChanges.map((event) => (
              <li key={`${event.pricingId}-${event.band.minInputTokensPerRequest}`}>
                <time dateTime={event.effectiveFrom}>{formatDate(event.effectiveFrom)}</time>
                <div>
                  <Link href={`/models/${detail.models.find(({ model }) => model.id === event.modelId)?.model.slug ?? ""}`}>
                    {modelNames.get(event.modelId) ?? "Model"}
                  </Link>
                  <span>{event.changes.length} rate {event.changes.length === 1 ? "dimension" : "dimensions"} changed</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </ContentPage>
  );
}