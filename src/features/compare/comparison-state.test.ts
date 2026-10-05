import { describe, expect, it } from "vitest";

import {
  DEFAULT_CALCULATOR_SCENARIO,
  parseComparisonSearchParams,
  serializeComparisonScenario,
} from "./comparison-state";

const allowed = ["alpha", "beta", "gamma", "delta", "epsilon"];

describe("comparison state codec", () => {
  it("normalizes duplicate, unknown, and more than four models", () => {
    const params = new URLSearchParams({ models: "alpha,beta,alpha,unknown,gamma,delta,epsilon" });

    expect(parseComparisonSearchParams(params, allowed).modelSlugs).toEqual([
      "alpha",
      "beta",
      "gamma",
      "delta",
    ]);
  });

  it("falls back safely for malformed or oversized quantities", () => {
    const params = new URLSearchParams({
      input: "oops",
      output: "1000000000000000001",
      cached: "-1",
      context: "1.5",
    });

    expect(parseComparisonSearchParams(params, allowed)).toMatchObject({
      inputText: DEFAULT_CALCULATOR_SCENARIO.inputText,
      outputText: DEFAULT_CALCULATOR_SCENARIO.outputText,
      cachedText: DEFAULT_CALCULATOR_SCENARIO.cachedText,
      contextText: DEFAULT_CALCULATOR_SCENARIO.contextText,
    });
  });

  it("uses defaults when optional values are omitted and ignores arbitrary fields", () => {
    const params = new URLSearchParams("prompt=secret&apiKey=never&anything=else");

    expect(parseComparisonSearchParams(params, allowed)).toEqual(DEFAULT_CALCULATOR_SCENARIO);
  });

  it("serializes scenarios in stable canonical order and omits default values", () => {
    const params = serializeComparisonScenario({
      modelSlugs: ["beta", "alpha"],
      inputText: "2M",
      outputText: "2M",
      cachedText: "0",
      contextText: "16K",
      presetSlug: "rag",
    });

    expect(params.toString()).toBe("models=beta%2Calpha&input=2M&context=16K&preset=rag");
    expect(params.has("prompt")).toBe(false);
  });

  it("round-trips a valid scenario", () => {
    const scenario = {
      modelSlugs: ["alpha", "gamma"],
      inputText: "4M",
      outputText: "750K",
      cachedText: "1M",
      contextText: "32K",
      presetSlug: "coding-agent",
    };

    expect(
      parseComparisonSearchParams(serializeComparisonScenario(scenario), allowed),
    ).toEqual(scenario);
  });
});
