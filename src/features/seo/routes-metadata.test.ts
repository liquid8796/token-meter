import { describe, expect, it } from "vitest";

function canonicalPath(metadata: unknown): string | null {
  const canonical = (metadata as { alternates?: { canonical?: unknown } })?.alternates?.canonical;
  if (!canonical) return null;
  return new URL(String(canonical)).pathname;
}

describe("public route canonicals", () => {
  it("canonicalizes durable static tool and content routes", async () => {
    const [home, models, compare, budget, about, privacy] = await Promise.all([
      import("@/app/page"),
      import("@/app/models/page"),
      import("@/app/compare/page"),
      import("@/app/budget/page"),
      import("@/app/about/page"),
      import("@/app/privacy/page"),
    ]);

    expect(canonicalPath(home.metadata)).toBe("/");
    expect(canonicalPath(models.metadata)).toBe("/models");
    expect(canonicalPath(compare.metadata)).toBe("/compare");
    expect(canonicalPath(budget.metadata)).toBe("/budget");
    expect(canonicalPath(about.metadata)).toBe("/about");
    expect(canonicalPath(privacy.metadata)).toBe("/privacy");
  });

  it("canonicalizes factual model and provider detail metadata", async () => {
    const [{ generateMetadata: modelMetadata }, { generateMetadata: providerMetadata }] = await Promise.all([
      import("@/app/models/[modelSlug]/page"),
      import("@/app/providers/[providerSlug]/page"),
    ]);

    const model = await modelMetadata({ params: Promise.resolve({ modelSlug: "gpt-6.1-sol" }) });
    const provider = await providerMetadata({ params: Promise.resolve({ providerSlug: "openai" }) });

    expect(canonicalPath(model)).toBe("/models/gpt-6.1-sol");
    expect(canonicalPath(provider)).toBe("/providers/openai");
  });
});
