"use client";

import { useMemo, useState } from "react";

import { solveRequestBudget, solveTokenMixBudget } from "@/domain/pricing/calculate-budget";
import { formatUsd } from "@/domain/pricing/format";
import { selectPricingBand } from "@/domain/pricing/pricing-band";
import { parseTokenQuantity } from "@/domain/pricing/quantity";
import type { PricingBand, Workload } from "@/domain/pricing/types";
import { serializeComparisonScenario } from "@/features/compare/comparison-state";

export interface BudgetBandDto {
  unitTokens: string;
  minInputTokensPerRequest: string;
  maxInputTokensPerRequest: string | null;
  inputPerUnit?: string;
  outputPerUnit?: string;
  cachedInputPerUnit?: string;
}

export interface BudgetModel {
  pricingId: string;
  slug: string;
  name: string;
  provider: string;
  sourceUrl: string;
  verifiedAt: string;
  bands: BudgetBandDto[];
}

type BudgetMode = "mix" | "requests";

function toDomainBand(band: BudgetBandDto): PricingBand {
  return {
    unitTokens: BigInt(band.unitTokens),
    minInputTokensPerRequest: BigInt(band.minInputTokensPerRequest),
    maxInputTokensPerRequest:
      band.maxInputTokensPerRequest === null ? null : BigInt(band.maxInputTokensPerRequest),
    inputPerUnit: band.inputPerUnit,
    outputPerUnit: band.outputPerUnit,
    cachedInputPerUnit: band.cachedInputPerUnit,
  };
}

function safeQuantity(value: string): bigint | null {
  try {
    return parseTokenQuantity(value);
  } catch {
    return null;
  }
}

function formatInteger(value: bigint): string {
  return value.toLocaleString("en-US");
}

export function BudgetCalculator({ models }: { models: BudgetModel[] }) {
  const [modelSlug, setModelSlug] = useState(models[0]?.slug ?? "");
  const [mode, setMode] = useState<BudgetMode>("mix");
  const [budgetText, setBudgetText] = useState("100");
  const [inputText, setInputText] = useState("1M");
  const [outputText, setOutputText] = useState("250K");
  const [cachedText, setCachedText] = useState("0");
  const [contextText, setContextText] = useState("");

  const model = models.find((item) => item.slug === modelSlug) ?? models[0];

  const calculation = useMemo(() => {
    if (!model) return null;
    const inputTokens = safeQuantity(inputText);
    const outputTokens = safeQuantity(outputText);
    const cachedInputTokens = safeQuantity(cachedText);
    if (inputTokens === null || outputTokens === null || cachedInputTokens === null) return null;
    if (cachedInputTokens > inputTokens) return null;

    const bands = model.bands.map(toDomainBand);
    const contextTokens = mode === "requests"
      ? inputTokens
      : contextText.trim() === ""
        ? undefined
        : safeQuantity(contextText) ?? undefined;
    if (mode === "mix" && contextText.trim() !== "" && safeQuantity(contextText) === null) return null;

    let selection;
    try {
      selection = selectPricingBand(bands, contextTokens);
    } catch {
      return null;
    }

    const workload: Workload = { inputTokens, outputTokens, cachedInputTokens };
    const result = mode === "mix"
      ? solveTokenMixBudget(budgetText, workload, selection.band)
      : solveRequestBudget(budgetText, workload, selection.band);
    if (!result) return null;

    return { result, selection, contextTokens };
  }, [budgetText, cachedText, contextText, inputText, mode, model, outputText]);

  const compareHref = useMemo(() => {
    if (!model || !calculation) return null;
    const { result, contextTokens } = calculation;
    const params = serializeComparisonScenario({
      modelSlugs: [model.slug],
      inputText: result.inputTokens.toString(),
      outputText: result.outputTokens.toString(),
      cachedText: result.cachedInputTokens.toString(),
      contextText: contextTokens?.toString() ?? "",
      presetSlug: "custom",
    });
    return `/compare?${params.toString()}`;
  }, [calculation, model]);

  if (!model) {
    return <p className="field-error" role="alert">No source-backed models are available.</p>;
  }

  const result = calculation?.result ?? null;
  const band = calculation?.selection.band ?? null;
  const bandLabel = band
    ? band.minInputTokensPerRequest > 0n
      ? `${formatInteger(band.minInputTokensPerRequest)}+ context band`
      : band.maxInputTokensPerRequest === null
        ? "Flat context rate"
        : `Up to ${formatInteger(band.maxInputTokensPerRequest)} context band`
    : "Rate unavailable";

  return (
    <div className="budget-instrument">
      <section className="budget-controls" aria-labelledby="budget-controls-title">
        <div className="panel-heading">
          <div><span className="section-index">01</span><h2 id="budget-controls-title">Set budget assumptions</h2></div>
        </div>

        <div className="budget-control-grid">
          <label className="field">
            <span>Model</span>
            <select value={model.slug} onChange={(event) => setModelSlug(event.target.value)}>
              {models.map((item) => <option key={item.slug} value={item.slug}>{item.provider} · {item.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Budget mode</span>
            <select value={mode} onChange={(event) => setMode(event.target.value as BudgetMode)}>
              <option value="mix">Token mix</option>
              <option value="requests">Requests</option>
            </select>
          </label>
          <label className="field">
            <span>Monthly budget (USD)</span>
            <input value={budgetText} onChange={(event) => setBudgetText(event.target.value)} inputMode="decimal" autoComplete="off" />
          </label>
        </div>

        <div className="budget-composition">
          <label className="field">
            <span>{mode === "mix" ? "Input tokens per mix unit" : "Input tokens per request"}</span>
            <input value={inputText} onChange={(event) => setInputText(event.target.value)} inputMode="decimal" autoComplete="off" />
          </label>
          <label className="field">
            <span>{mode === "mix" ? "Output tokens per mix unit" : "Output tokens per request"}</span>
            <input value={outputText} onChange={(event) => setOutputText(event.target.value)} inputMode="decimal" autoComplete="off" />
          </label>
          <label className="field">
            <span>{mode === "mix" ? "Cached input tokens per mix unit" : "Cached input tokens per request"}</span>
            <input value={cachedText} onChange={(event) => setCachedText(event.target.value)} inputMode="decimal" autoComplete="off" />
          </label>
          {mode === "mix" ? (
            <label className="field">
              <span>Average input tokens per request</span>
              <input value={contextText} onChange={(event) => setContextText(event.target.value)} inputMode="decimal" autoComplete="off" placeholder="Optional" />
              <small>Used only to select published long-context pricing bands.</small>
            </label>
          ) : null}
        </div>
      </section>

      <section className="budget-readout" aria-labelledby="budget-readout-title" aria-live="polite">
        <div className="panel-heading">
          <div><span className="section-index">02</span><h2 id="budget-readout-title">Budget capacity</h2></div>
          <span className="selection-count">{model.provider}</span>
        </div>

        {result ? (
          <div className="budget-result">
            {"requestCount" in result ? (
              <div className="budget-headline">
                <strong>{formatInteger(result.requestCount)} {result.requestCount === 1n ? "request" : "requests"}</strong>
                <span>whole requests within the monthly budget</span>
              </div>
            ) : (
              <div className="budget-headline">
                <strong>{result.scale}× workload</strong>
                <span>scaled from the composition entered above</span>
              </div>
            )}

            <dl className="budget-metrics">
              <div><dt>Input</dt><dd>{formatInteger(result.inputTokens)} input tokens</dd></div>
              <div><dt>Output</dt><dd>{formatInteger(result.outputTokens)} output tokens</dd></div>
              <div><dt>Cached input</dt><dd>{formatInteger(result.cachedInputTokens)} tokens</dd></div>
              <div><dt>Estimated spend</dt><dd>{formatUsd(result.estimatedSpend)}</dd></div>
              <div><dt>Rate band</dt><dd>{bandLabel}</dd></div>
            </dl>

            <div className="budget-actions">
              {compareHref ? <a href={compareHref}>Compare this workload</a> : null}
              <a href={model.sourceUrl} target="_blank" rel="noreferrer">Official pricing ↗</a>
            </div>
            <p className="budget-provenance">Pricing record {model.pricingId} · verified {new Date(model.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
        ) : (
          <p className="field-error" role="alert">Enter a valid budget and supported rates/workload within TokenMeter&apos;s bounded calculation limits.</p>
        )}
      </section>
    </div>
  );
}
