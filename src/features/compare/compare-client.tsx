"use client";

import { useEffect, useMemo, useState } from "react";

import { Calculator, type CalculatorModel } from "@/features/calculator/calculator";
import {
  parseComparisonSearchParams,
  serializeComparisonScenario,
  type CalculatorScenario,
} from "@/features/compare/comparison-state";

interface CompareClientProps {
  models: CalculatorModel[];
  initialScenario: CalculatorScenario;
}

function withDefaultModels(
  scenario: CalculatorScenario,
  models: CalculatorModel[],
): CalculatorScenario {
  if (scenario.modelSlugs.length > 0) return scenario;
  return {
    ...scenario,
    modelSlugs: models.slice(0, 4).map((model) => model.slug),
  };
}

export function CompareClient({ models, initialScenario }: CompareClientProps) {
  const normalizedInitial = withDefaultModels(initialScenario, models);
  const [restoredScenario, setRestoredScenario] = useState(normalizedInitial);
  const [currentScenario, setCurrentScenario] = useState(normalizedInitial);
  const [restoreVersion, setRestoreVersion] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const allowedModelSlugs = useMemo(() => models.map((model) => model.slug), [models]);

  useEffect(() => {
    function restoreFromLocation() {
      const parsed = parseComparisonSearchParams(
        new URLSearchParams(window.location.search),
        allowedModelSlugs,
      );
      const next = withDefaultModels(parsed, models);
      setRestoredScenario(next);
      setCurrentScenario(next);
      setRestoreVersion((value) => value + 1);
      setCopyStatus("");
    }

    window.addEventListener("popstate", restoreFromLocation);
    return () => window.removeEventListener("popstate", restoreFromLocation);
  }, [allowedModelSlugs, models]);

  function handleScenarioChange(next: CalculatorScenario) {
    setCurrentScenario(next);
    setCopyStatus("");
    const query = serializeComparisonScenario(next).toString();
    window.history.replaceState(window.history.state, "", query ? `/compare?${query}` : "/compare");
  }

  async function copyShareLink() {
    const query = serializeComparisonScenario(currentScenario).toString();
    const shareUrl = new URL(query ? `/compare?${query}` : "/compare", window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("Link copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  return (
    <>
      <div className="compare-toolbar" aria-label="Scenario sharing controls">
        <div>
          <strong>Shareable scenario</strong>
          <span>Only model slugs and aggregate token quantities are stored in the URL.</span>
        </div>
        <button type="button" onClick={copyShareLink}>Copy share link</button>
        <span className="copy-status" aria-live="polite">{copyStatus}</span>
      </div>
      <Calculator
        key={restoreVersion}
        models={models}
        initialScenario={restoredScenario}
        onScenarioChange={handleScenarioChange}
      />
    </>
  );
}
