import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ModelPage, { generateMetadata } from "./page";

describe("model detail route", () => {
  it("renders source-backed pricing and an embedded calculator", async () => {
    const params = Promise.resolve({ modelSlug: "gpt-6.1-sol" });
    render(await ModelPage({ params }));

    expect(screen.getByRole("heading", { level: 1, name: "GPT-6.1 Sol" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /OpenAI provider/i })).toHaveAttribute("href", "/providers/openai");
    expect(screen.getAllByText(/verified oct 5, 2026/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/monthly input tokens/i)).toBeInTheDocument();
    const sourceLinks = screen.getAllByRole("link", { name: /official pricing/i });
    expect(sourceLinks.some((link) => link.getAttribute("href")?.includes("openai"))).toBe(true);
  });

  it("builds factual model metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ modelSlug: "gpt-6.1-sol" }),
    });

    expect(metadata.title).toBe("GPT-6.1 Sol API pricing");
    expect(metadata.description).toContain("OpenAI");
  });

  it("returns a standard Next.js 404 for an unknown slug", async () => {
    try {
      await ModelPage({ params: Promise.resolve({ modelSlug: "missing-model" }) });
      throw new Error("expected notFound");
    } catch (error) {
      expect((error as { digest?: string }).digest).toContain("NEXT_HTTP_ERROR_FALLBACK;404");
    }
  });
});