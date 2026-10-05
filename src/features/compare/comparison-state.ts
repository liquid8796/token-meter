import { parseTokenQuantity } from "@/domain/pricing/quantity";

export interface CalculatorScenario {
  modelSlugs: string[];
  inputText: string;
  outputText: string;
  cachedText: string;
  contextText: string;
  presetSlug: string;
}

export const DEFAULT_CALCULATOR_SCENARIO: CalculatorScenario = {
  modelSlugs: [],
  inputText: "1M",
  outputText: "2M",
  cachedText: "0",
  contextText: "",
  presetSlug: "custom",
};

const ALLOWED_KEYS = ["models", "input", "output", "cached", "context", "preset"] as const;
const PRESET_PATTERN = /^[a-z0-9-]{1,48}$/;

function safeQuantity(value: string | null, fallback: string, allowBlank = false): string {
  if (value === null) return fallback;
  const normalized = value.trim();
  if (allowBlank && normalized === "") return "";

  try {
    parseTokenQuantity(normalized);
    return normalized;
  } catch {
    return fallback;
  }
}

function safePreset(value: string | null): string {
  if (!value || !PRESET_PATTERN.test(value)) return DEFAULT_CALCULATOR_SCENARIO.presetSlug;
  return value;
}

export function parseComparisonSearchParams(
  params: URLSearchParams,
  allowedModelSlugs: readonly string[],
): CalculatorScenario {
  const allowed = new Set(allowedModelSlugs);
  const seen = new Set<string>();
  const modelSlugs: string[] = [];

  for (const slug of (params.get("models") ?? "").split(",")) {
    const normalized = slug.trim();
    if (!normalized || !allowed.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    modelSlugs.push(normalized);
    if (modelSlugs.length === 4) break;
  }

  return {
    modelSlugs,
    inputText: safeQuantity(params.get("input"), DEFAULT_CALCULATOR_SCENARIO.inputText),
    outputText: safeQuantity(params.get("output"), DEFAULT_CALCULATOR_SCENARIO.outputText),
    cachedText: safeQuantity(params.get("cached"), DEFAULT_CALCULATOR_SCENARIO.cachedText),
    contextText: safeQuantity(params.get("context"), DEFAULT_CALCULATOR_SCENARIO.contextText, true),
    presetSlug: safePreset(params.get("preset")),
  };
}

export function serializeComparisonScenario(scenario: CalculatorScenario): URLSearchParams {
  const params = new URLSearchParams();
  if (scenario.modelSlugs.length > 0) params.set("models", scenario.modelSlugs.slice(0, 4).join(","));
  if (scenario.inputText !== DEFAULT_CALCULATOR_SCENARIO.inputText) params.set("input", scenario.inputText);
  if (scenario.outputText !== DEFAULT_CALCULATOR_SCENARIO.outputText) params.set("output", scenario.outputText);
  if (scenario.cachedText !== DEFAULT_CALCULATOR_SCENARIO.cachedText) params.set("cached", scenario.cachedText);
  if (scenario.contextText !== DEFAULT_CALCULATOR_SCENARIO.contextText) params.set("context", scenario.contextText);
  if (scenario.presetSlug !== DEFAULT_CALCULATOR_SCENARIO.presetSlug) params.set("preset", scenario.presetSlug);
  return params;
}

export function comparisonSearchParamsFromRecord(
  params: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const normalized = new URLSearchParams();
  for (const key of ALLOWED_KEYS) {
    const value = params[key];
    if (typeof value === "string") normalized.set(key, value);
    else if (Array.isArray(value) && value.length > 0) normalized.set(key, value[0]);
  }
  return normalized;
}
