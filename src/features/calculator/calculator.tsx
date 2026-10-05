"use client";

import { useMemo, useState } from "react";

import { calculateModelCost } from "@/domain/pricing/calculate-cost";
import { compareCosts } from "@/domain/pricing/compare-costs";
import { formatTokenQuantity, formatUsd } from "@/domain/pricing/format";
import { selectPricingBand } from "@/domain/pricing/pricing-band";
import { parseTokenQuantity } from "@/domain/pricing/quantity";
import type { CostBreakdown, ModelStatus, PricingBand, Workload } from "@/domain/pricing/types";
import type { CalculatorScenario } from "@/features/compare/comparison-state";
import { OptimizerPanel } from "@/features/optimizer/optimizer-panel";
import { WORKLOAD_PRESETS, getWorkloadPreset } from "@/features/presets/workload-presets";

export interface CalculatorBand {
  unitTokens: string;
  minInputTokensPerRequest: string;
  maxInputTokensPerRequest: string | null;
  inputPerUnit?: string;
  outputPerUnit?: string;
  cachedInputPerUnit?: string;
  cacheWritePerUnit?: string;
  batchInputPerUnit?: string;
  batchOutputPerUnit?: string;
}

export interface CalculatorModel {
  slug: string;
  name: string;
  provider: string;
  providerSlug?: string;
  status: ModelStatus;
  contextWindowTokens: string | null;
  sourceUrl: string;
  verifiedAt: string;
  bands: CalculatorBand[];
}

interface ModelResult {
  model: CalculatorModel;
  breakdown: CostBreakdown;
  assumption: "base-band" | null;
  selectedBand: PricingBand;
}

interface CalculatorProps {
  models: CalculatorModel[];
  initialSelectedSlugs?: string[];
  initialScenario?: CalculatorScenario;
  onScenarioChange?: (scenario: CalculatorScenario) => void;
}

interface CalculatorInputState {
  inputText: string;
  outputText: string;
  cachedText: string;
  contextText: string;
}

const DEFAULT_INPUT = "1M";
const DEFAULT_OUTPUT = "2M";

function deserializeBand(band: CalculatorBand): PricingBand {
  return {
    ...band,
    unitTokens: BigInt(band.unitTokens),
    minInputTokensPerRequest: BigInt(band.minInputTokensPerRequest),
    maxInputTokensPerRequest:
      band.maxInputTokensPerRequest === null
        ? null
        : BigInt(band.maxInputTokensPerRequest),
  };
}

function modelSupportsCache(model: CalculatorModel) {
  return model.bands.some((band) => band.cachedInputPerUnit !== undefined);
}

function tryParseQuantity(value: string) {
  try {
    return { value: parseTokenQuantity(value), error: null };
  } catch {
    return { value: null, error: "Enter a token quantity such as 250K, 3M, or 1.5B." };
  }
}

function buildResults(
  models: CalculatorModel[],
  selectedSlugs: string[],
  inputTokens: bigint,
  outputTokens: bigint,
  cachedInputTokens: bigint,
  averageInputTokensPerRequest?: bigint,
): ModelResult[] {
  return selectedSlugs.flatMap((slug) => {
    const model = models.find((candidate) => candidate.slug === slug);
    if (!model) return [];

    const selection = selectPricingBand(
      model.bands.map(deserializeBand),
      averageInputTokensPerRequest,
    );
    const breakdown = calculateModelCost(
      { inputTokens, outputTokens, cachedInputTokens },
      selection.band,
    );

    return [
      {
        model,
        breakdown,
        assumption: selection.assumption,
        selectedBand: selection.band,
      },
    ];
  });
}

function evaluateCalculator(
  models: CalculatorModel[],
  selectedSlugs: string[],
  inputs: CalculatorInputState,
) {
  const selectedModels = models.filter((model) => selectedSlugs.includes(model.slug));
  const supportsCache = selectedModels.some(modelSupportsCache);
  const input = tryParseQuantity(inputs.inputText);
  const output = tryParseQuantity(inputs.outputText);
  const cached = tryParseQuantity(inputs.cachedText);
  const context = inputs.contextText.trim()
    ? tryParseQuantity(inputs.contextText)
    : { value: undefined, error: null };

  let error = input.error ?? output.error ?? context.error;
  if (supportsCache) {
    error ??= cached.error;
  }

  if (
    error ||
    input.value === null ||
    output.value === null ||
    (supportsCache && cached.value === null)
  ) {
    return { results: null, workload: null, error, supportsCache };
  }

  const workload: Workload = {
    inputTokens: input.value,
    outputTokens: output.value,
    cachedInputTokens: supportsCache ? (cached.value ?? 0n) : 0n,
  };

  try {
    return {
      results: buildResults(
        models,
        selectedSlugs,
        workload.inputTokens,
        workload.outputTokens,
        workload.cachedInputTokens,
        context.value === null ? undefined : context.value,
      ),
      workload,
      error: null,
      supportsCache,
    };
  } catch (caughtError) {
    return {
      results: null,
      workload: null,
      error:
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to calculate this workload.",
      supportsCache,
    };
  }
}

export function Calculator({
  models,
  initialSelectedSlugs = models.slice(0, 3).map((model) => model.slug),
  initialScenario,
  onScenarioChange,
}: CalculatorProps) {
  const requestedSelection = initialScenario?.modelSlugs.length
    ? initialScenario.modelSlugs
    : initialSelectedSlugs;
  const initialSelection = requestedSelection
    .filter((slug) => models.some((model) => model.slug === slug))
    .slice(0, 4);
  const initialInputs: CalculatorInputState = {
    inputText: initialScenario?.inputText ?? DEFAULT_INPUT,
    outputText: initialScenario?.outputText ?? DEFAULT_OUTPUT,
    cachedText: initialScenario?.cachedText ?? "0",
    contextText: initialScenario?.contextText ?? "",
  };
  const initialEvaluation = evaluateCalculator(models, initialSelection, initialInputs);
  const [selectedSlugs, setSelectedSlugs] = useState(initialSelection);
  const [inputText, setInputText] = useState(initialInputs.inputText);
  const [outputText, setOutputText] = useState(initialInputs.outputText);
  const [cachedText, setCachedText] = useState(initialInputs.cachedText);
  const [contextText, setContextText] = useState(initialInputs.contextText);
  const [presetSlug, setPresetSlug] = useState(initialScenario?.presetSlug ?? "custom");
  const [currentResults, setCurrentResults] = useState<ModelResult[]>(initialEvaluation.results ?? []);
  const [currentWorkload, setCurrentWorkload] = useState<Workload | null>(initialEvaluation.workload);
  const [calculatorError, setCalculatorError] = useState<string | null>(initialEvaluation.error);

  const selectedModels = useMemo(
    () => models.filter((model) => selectedSlugs.includes(model.slug)),
    [models, selectedSlugs],
  );
  const supportsCache = selectedModels.some(modelSupportsCache);
  const activePreset = getWorkloadPreset(presetSlug);

  function emitScenario(
    nextSelectedSlugs: string[],
    nextInputs: CalculatorInputState,
    nextPresetSlug: string,
  ) {
    onScenarioChange?.({
      modelSlugs: nextSelectedSlugs,
      ...nextInputs,
      presetSlug: nextPresetSlug,
    });
  }

  function recalculate(
    nextSelectedSlugs: string[],
    nextInputs: CalculatorInputState,
    nextPresetSlug: string,
  ) {
    const evaluation = evaluateCalculator(models, nextSelectedSlugs, nextInputs);
    setCalculatorError(evaluation.error);
    if (evaluation.results !== null && evaluation.workload !== null) {
      setCurrentResults(evaluation.results);
      setCurrentWorkload(evaluation.workload);
      emitScenario(nextSelectedSlugs, nextInputs, nextPresetSlug);
    }
  }

  function currentInputs(overrides: Partial<CalculatorInputState> = {}): CalculatorInputState {
    return {
      inputText,
      outputText,
      cachedText,
      contextText,
      ...overrides,
    };
  }

  function updateManualInput(field: keyof CalculatorInputState, value: string) {
    if (field === "inputText") setInputText(value);
    if (field === "outputText") setOutputText(value);
    if (field === "cachedText") setCachedText(value);
    if (field === "contextText") setContextText(value);
    setPresetSlug("custom");
    recalculate(selectedSlugs, currentInputs({ [field]: value }), "custom");
  }

  function applyPreset(nextSlug: string) {
    setPresetSlug(nextSlug);
    const preset = getWorkloadPreset(nextSlug);
    if (!preset) {
      recalculate(selectedSlugs, currentInputs(), "custom");
      return;
    }

    const nextInputs: CalculatorInputState = {
      inputText: preset.inputText,
      outputText: preset.outputText,
      cachedText: preset.cachedText,
      contextText: preset.contextText,
    };
    setInputText(nextInputs.inputText);
    setOutputText(nextInputs.outputText);
    setCachedText(nextInputs.cachedText);
    setContextText(nextInputs.contextText);
    recalculate(selectedSlugs, nextInputs, preset.slug);
  }

  const compared = compareCosts(
    currentResults.map((result) => ({
      key: result.model.slug,
      totalCost: result.breakdown.totalCost,
    })),
  );

  function toggleModel(slug: string) {
    let nextSelectedSlugs = selectedSlugs;

    if (selectedSlugs.includes(slug)) {
      if (selectedSlugs.length > 1) {
        nextSelectedSlugs = selectedSlugs.filter((item) => item !== slug);
      }
    } else if (selectedSlugs.length < 4) {
      nextSelectedSlugs = [...selectedSlugs, slug];
    }

    if (nextSelectedSlugs === selectedSlugs) return;

    setSelectedSlugs(nextSelectedSlugs);
    recalculate(nextSelectedSlugs, currentInputs(), presetSlug);
  }

  return (
    <div className="calculator-grid">
      <section className="calculator-panel" aria-labelledby="workload-title">
        <div className="panel-heading">
          <div>
            <span className="section-index">01</span>
            <h2 id="workload-title">Set your workload</h2>
          </div>
          <span className="selection-count">{selectedSlugs.length}/4 models</span>
        </div>

        <label className="field preset-field">
          <span>Workload preset</span>
          <select value={presetSlug} onChange={(event) => applyPreset(event.target.value)}>
            <option value="custom">Custom workload</option>
            {WORKLOAD_PRESETS.map((preset) => (
              <option value={preset.slug} key={preset.slug}>{preset.name}</option>
            ))}
          </select>
          <small>{activePreset?.disclaimer ?? "Choose an example starting point or enter your measured workload directly."}</small>
        </label>

        <div className="field-grid">
          <label className="field">
            <span>Monthly input tokens</span>
            <input
              value={inputText}
              onChange={(event) => updateManualInput("inputText", event.target.value)}
              inputMode="decimal"
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span>Monthly output tokens</span>
            <input
              value={outputText}
              onChange={(event) => updateManualInput("outputText", event.target.value)}
              inputMode="decimal"
              autoComplete="off"
            />
          </label>
          {supportsCache ? (
            <label className="field">
              <span>Cached input tokens</span>
              <input
                value={cachedText}
                onChange={(event) => updateManualInput("cachedText", event.target.value)}
                inputMode="decimal"
                autoComplete="off"
              />
            </label>
          ) : null}
          <label className="field">
            <span>Average input tokens per request</span>
            <input
              value={contextText}
              onChange={(event) => updateManualInput("contextText", event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              placeholder="Optional"
            />
            <small>Used only where providers charge a long-context rate.</small>
          </label>
        </div>

        {calculatorError ? (
          <p className="field-error" role="alert">
            {calculatorError}
          </p>
        ) : null}

        <fieldset className="model-picker">
          <legend>Models to compare</legend>
          <div className="model-picker-grid">
            {models.map((model) => {
              const checked = selectedSlugs.includes(model.slug);
              const disabled = !checked && selectedSlugs.length >= 4;

              return (
                <label className="model-option" key={model.slug} data-selected={checked || undefined}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleModel(model.slug)}
                  />
                  <span className="model-option-copy">
                    <strong>{model.name}</strong>
                    <span>{model.provider}</span>
                  </span>
                  <span className="model-option-status">{model.status}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>

      <section className="results-panel" aria-labelledby="estimate-title" aria-live="polite">
        <div className="panel-heading">
          <div>
            <span className="section-index">02</span>
            <h2 id="estimate-title">Live monthly estimate</h2>
          </div>
          <span className="live-indicator"><i /> calibrated</span>
        </div>

        <div className="result-stack">
          {currentResults.map((result) => {
            const comparison = compared.find((item) => item.key === result.model.slug);
            const total = Number(result.breakdown.totalCost);
            const inputShare = total > 0 ? (Number(result.breakdown.inputCost) / total) * 100 : 0;
            const outputShare = total > 0 ? (Number(result.breakdown.outputCost) / total) * 100 : 0;
            const cachedShare = Math.max(0, 100 - inputShare - outputShare);

            return (
              <article className="model-result" data-testid={`result-${result.model.slug}`} key={result.model.slug}>
                <div className="result-topline">
                  <div>
                    <span>{result.model.provider}</span>
                    <h3>{result.model.name}</h3>
                  </div>
                  {comparison?.isCheapest ? <span className="best-rate">Lowest cost</span> : null}
                </div>

                <div className="result-price-row">
                  <strong>{formatUsd(result.breakdown.totalCost)}</strong>
                  <span>/ month</span>
                </div>

                <div className="cost-rail" aria-label="Cost composition">
                  <span className="rail-input" style={{ width: `${inputShare}%` }} />
                  <span className="rail-output" style={{ width: `${outputShare}%` }} />
                  {cachedShare > 0 ? (
                    <span className="rail-cache" style={{ width: `${cachedShare}%` }} />
                  ) : null}
                </div>

                <dl className="cost-breakdown">
                  <div><dt>Input</dt><dd>{formatUsd(result.breakdown.inputCost)}</dd></div>
                  <div><dt>Output</dt><dd>{formatUsd(result.breakdown.outputCost)}</dd></div>
                  {result.breakdown.cachedInputCost !== null ? (
                    <div><dt>Cached</dt><dd>{formatUsd(result.breakdown.cachedInputCost)}</dd></div>
                  ) : null}
                  <div>
                    <dt>Context rate</dt>
                    <dd>
                      {result.selectedBand.maxInputTokensPerRequest === null &&
                      result.selectedBand.minInputTokensPerRequest === 0n
                        ? "Flat"
                        : result.assumption
                          ? "Base assumed"
                          : `${formatTokenQuantity(result.selectedBand.minInputTokensPerRequest)}+`}
                    </dd>
                  </div>
                </dl>

                {currentWorkload ? (
                  <OptimizerPanel
                    modelName={result.model.name}
                    workload={currentWorkload}
                    band={result.selectedBand}
                  />
                ) : null}

                <div className="result-footnote">
                  <span>Verified {new Date(result.model.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <a href={result.model.sourceUrl} target="_blank" rel="noreferrer">Official pricing ↗</a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
