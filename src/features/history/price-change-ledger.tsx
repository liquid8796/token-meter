import Link from "next/link";

import { formatTokenQuantity, formatUsd } from "@/domain/pricing/format";
import type { PriceRateDimension } from "@/domain/pricing/pricing-history";
import type { PriceChangeFeedState } from "./load-price-changes";

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

function formatContextBand(minimum: bigint, maximum: bigint | null) {
  if (minimum === 0n && maximum === null) return "All context sizes";
  if (maximum === null) return `${formatTokenQuantity(minimum)}+ input/request`;
  return `${formatTokenQuantity(minimum)}–${formatTokenQuantity(maximum)} input/request`;
}

function formatPercentage(value: string | null) {
  if (value === null) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount);
  return `${amount > 0 ? "+" : ""}${formatted}%`;
}

export function PriceChangeLedger({ state }: { state: PriceChangeFeedState }) {
  if (state.status === "unavailable") {
    return (
      <p className="instrument-empty">
        Pricing history is temporarily unavailable. Current source-backed model pricing remains available.
      </p>
    );
  }

  if (state.items.length === 0) {
    return <p className="instrument-empty">No verified numeric price changes are recorded yet.</p>;
  }

  return (
    <ol className="change-ledger">
      {state.items.map((event) => (
        <li className="change-ledger-row" key={`${event.pricingId}-${event.band.minInputTokensPerRequest}`}>
          <div className="change-ledger-date">
            <time dateTime={event.effectiveFrom}>
              {event.effectiveFromBasis === "official" ? "Effective" : "Verified"} {formatDate(event.effectiveFrom)}
            </time>
            <span>{formatContextBand(event.band.minInputTokensPerRequest, event.band.maxInputTokensPerRequest)}</span>
          </div>
          <div className="change-ledger-body">
            <div className="change-ledger-identity">
              <Link href={`/providers/${event.providerSlug}`}>{event.providerName}</Link>
              <Link href={`/models/${event.modelSlug}`}>{event.modelName}</Link>
            </div>
            <div className="change-ledger-rates">
              {event.changes.map((change) => {
                const delta = formatPercentage(change.percentageDelta);
                return (
                  <div key={change.dimension}>
                    <span>{DIMENSION_LABELS[change.dimension]}</span>
                    <strong>{change.previous === null ? "unavailable" : formatUsd(change.previous)}</strong>
                    <span aria-hidden="true">→</span>
                    <strong>{change.current === null ? "unavailable" : formatUsd(change.current)}</strong>
                    {delta ? <em>{delta}</em> : null}
                  </div>
                );
              })}
            </div>
          </div>
          <a href={event.sourceUrl} target="_blank" rel="noreferrer">Official source ↗</a>
        </li>
      ))}
    </ol>
  );
}
