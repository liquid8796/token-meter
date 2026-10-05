import { formatUsd } from "@/domain/pricing/format";
import {
  calculateBatchOptimization,
  calculateCacheOptimization,
  type OptimizationResult,
} from "@/domain/pricing/calculate-optimization";
import type { PricingBand, Workload } from "@/domain/pricing/types";

interface OptimizerPanelProps {
  modelName: string;
  workload: Workload;
  band: PricingBand;
}

function SavingsRow({
  label,
  result,
  unavailable,
}: {
  label: string;
  result: OptimizationResult | null;
  unavailable: string;
}) {
  return (
    <div className="optimizer-row">
      <div className="optimizer-label">
        <strong>{label}</strong>
        <span>{result ? result.limitation : unavailable}</span>
      </div>
      {result ? (
        <div className="optimizer-value">
          <strong>Save {formatUsd(result.absoluteSavings)}</strong>
          <span>{result.percentageSavings}% · {formatUsd(result.optimized)} optimized</span>
        </div>
      ) : (
        <span className="optimizer-unavailable">Unavailable</span>
      )}
    </div>
  );
}

export function OptimizerPanel({ modelName, workload, band }: OptimizerPanelProps) {
  const cache = calculateCacheOptimization(workload, band);
  const batch = calculateBatchOptimization(workload, band);

  const cacheUnavailable = workload.cachedInputTokens <= 0n
    ? "Set cached input tokens above zero to estimate cache-read savings."
    : band.cachedInputPerUnit === undefined
      ? "Published cache-read rate unavailable for this pricing band."
      : "Cache-read comparison unavailable for this workload.";

  const batchUnavailable = workload.cachedInputTokens > 0n
    ? "Batch + cache comparison unavailable: no published comparable batch-cache rate is stored for this pricing band."
    : band.batchInputPerUnit === undefined || band.batchOutputPerUnit === undefined
      ? "Published batch rate unavailable for one or more required dimensions."
      : "Batch comparison unavailable for this workload.";

  return (
    <section className="optimizer-panel" aria-label={`${modelName} savings optimizer`}>
      <div className="optimizer-heading">
        <span>Rate alternatives</span>
        <span>source-backed only</span>
      </div>
      <SavingsRow label="Cache-read" result={cache} unavailable={cacheUnavailable} />
      <SavingsRow label="Batch" result={batch} unavailable={batchUnavailable} />
    </section>
  );
}
