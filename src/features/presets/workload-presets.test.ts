import { describe, expect, it } from "vitest";

import { parseTokenQuantity } from "@/domain/pricing/quantity";
import { WORKLOAD_PRESETS, getWorkloadPreset } from "./workload-presets";

describe("workload presets", () => {
  it("publishes five transparent editable presets", () => {
    expect(WORKLOAD_PRESETS).toHaveLength(5);
    expect(WORKLOAD_PRESETS.map((preset) => preset.slug)).toEqual([
      "chatbot",
      "rag",
      "coding-agent",
      "document-processing",
      "high-cache",
    ]);

    for (const preset of WORKLOAD_PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.disclaimer).toMatch(/starting point|example|estimate/i);
      expect(parseTokenQuantity(preset.inputText)).toBeGreaterThanOrEqual(0n);
      expect(parseTokenQuantity(preset.outputText)).toBeGreaterThanOrEqual(0n);
      expect(parseTokenQuantity(preset.cachedText)).toBeGreaterThanOrEqual(0n);
      expect(parseTokenQuantity(preset.contextText)).toBeGreaterThanOrEqual(0n);
    }
  });

  it("returns presets by slug and leaves custom unknown", () => {
    expect(getWorkloadPreset("rag")?.name).toBe("RAG pipeline");
    expect(getWorkloadPreset("custom")).toBeUndefined();
    expect(getWorkloadPreset("missing")).toBeUndefined();
  });
});
