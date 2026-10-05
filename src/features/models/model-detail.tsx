import Link from "next/link";

import { ContentPage } from "@/components/content-page";
import { formatTokenQuantity, formatUsd } from "@/domain/pricing/format";
import type { PriceRateDimension } from "@/domain/pricing/pricing-history";
import { Calculator, type CalculatorModel } from "@/features/calculator/calculator";
import type { ModelDetail } from "./load-model-detail";

const DIMENSION_LABELS: Record<PriceRateDimension, string> = {
  inputPerUnit: "Input",
  outputPerUnit: "Output",
  cachedInputPerUnit: "Cache read",
  cacheWritePerUnit: "Cache write",
  batchInputPerUnit: "Batch input",
  batchOutputPerUnit: "Batch output",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLimit(value: bigint | null) {
  return value === null ? "Not published" : formatTokenQuantity(value);
}

function formatContextRange(minimum: bigint, maximum: bigint | null) {
  if (minimum === 0n && maximum === null) return "All contexts";
  if (maximum === null) return `${formatTokenQuantity(minimum)}+ input/request`;
  return `${formatTokenQuantity(minimum)}–${formatTokenQuantity(maximum)} input/request`;
}

export function ModelDetailView({
  detail,
  calculatorModels,
}: {
  detail: ModelDetail;
  calculatorModels: CalculatorModel[];
}) {
  const { model, provider, pricing, relatedModels, history } = detail;

  return (
    <ContentPage
      eyebrow={`${provider.name} · ${model.status}`}
      title={model.name}
      description={model.description}
    >
      <section className="model-sheet" aria-label={`${model.name} pricing details`}>
        <div className="model-sheet-readout">
          <div>
            <span className="instrument-label">API model</span>
            <code>{model.apiModelId}</code>
          </div>
          <dl>
            <div><dt>Context</dt><dd>{formatLimit(model.contextWindowTokens)}</dd></div>
            <div><dt>Max output</dt><dd>{formatLimit(model.maxOutputTokens)}</dd></div>
            <div><dt>Bands</dt><dd>{pricing.bands.length.toString().padStart(2, "0")}</dd></div>
          </dl>
        </div>

        <div className="rate-sheet">
          <div className="section-rule">
            <span>Current standard pricing</span>
            <span>USD · per {formatTokenQuantity(pricing.bands[0].unitTokens)} tokens</span>
          </div>
          {pricing.bands.map((band) => (
            <article className="rate-band" key={band.minInputTokensPerRequest.toString()}>
              <div className="rate-band-context">
                <span>Context band</span>
                <strong>{formatContextRange(band.minInputTokensPerRequest, band.maxInputTokensPerRequest)}</strong>
              </div>
              <dl className="rate-band-values">
                <div><dt>Input</dt><dd>{band.inputPerUnit ? formatUsd(band.inputPerUnit) : "—"}</dd></div>
                <div><dt>Output</dt><dd>{band.outputPerUnit ? formatUsd(band.outputPerUnit) : "—"}</dd></div>
                {band.cachedInputPerUnit ? <div><dt>Cache read</dt><dd>{formatUsd(band.cachedInputPerUnit)}</dd></div> : null}
                {band.cacheWritePerUnit ? <div><dt>Cache write</dt><dd>{formatUsd(band.cacheWritePerUnit)}</dd></div> : null}
                {band.batchInputPerUnit ? <div><dt>Batch input</dt><dd>{formatUsd(band.batchInputPerUnit)}</dd></div> : null}
                {band.batchOutputPerUnit ? <div><dt>Batch output</dt><dd>{formatUsd(band.batchOutputPerUnit)}</dd></div> : null}
              </dl>
            </article>
          ))}
        </div>

        <div className="source-strip">
          <div>
            <span className="instrument-label">Pricing provenance</span>
            <strong>Verified {formatDate(pricing.verifiedAt)}</strong>
          </div>
          <div className="source-strip-actions">
            <Link href={`/providers/${provider.slug}`} aria-label={`${provider.name} provider`}>
              {provider.name} provider
            </Link>
            <a href={pricing.sourceUrl} target="_blank" rel="noreferrer">Official pricing source ↗</a>
          </div>
        </div>
      </section>

      <section className="history-sheet" aria-labelledby="history-title">
        <div className="section-rule"><span id="history-title">Pricing history</span><span>Source-backed revisions only</span></div>
        {history.status === "unavailable" ? (
          <p className="instrument-empty">History temporarily unavailable. Current pricing remains available from the trusted snapshot.</p>
        ) : history.changes.length === 0 ? (
          <p className="instrument-empty">No verified numeric price change is recorded for this model yet.</p>
        ) : (
          <ol className="history-ledger">
            {history.changes.map((event) => (
              <li key={`${event.pricingId}-${event.band.minInputTokensPerRequest}`}>
                <time dateTime={event.effectiveFrom}>
                  {event.effectiveFromBasis === "official" ? "Effective" : "Verified"} {formatDate(event.effectiveFrom)}
                </time>
                <div>
                  {event.changes.map((change) => (
                    <span key={change.dimension}>
                      {DIMENSION_LABELS[change.dimension]}: {change.previous === null ? "unavailable" : formatUsd(change.previous)} → {change.current === null ? "unavailable" : formatUsd(change.current)}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="detail-calculator" aria-label={`${model.name} cost calculator`}>
        <div className="section-rule"><span>Price a workload</span><span>Preselected: {model.name}</span></div>
        <Calculator models={calculatorModels} initialSelectedSlugs={[model.slug]} />
      </section>

      {relatedModels.length > 0 ? (
        <section className="related-models" aria-label="Related models">
          <div className="section-rule"><span>Same model family</span><span>{provider.name}</span></div>
          <div className="related-model-grid">
            {relatedModels.map((related) => (
              <Link href={`/models/${related.slug}`} key={related.id}>
                <span>{related.status}</span>
                <strong>{related.name}</strong>
                <code>{related.apiModelId}</code>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </ContentPage>
  );
}