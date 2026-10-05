import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProviderPage, { generateMetadata } from "./page";

describe("provider detail route", () => {
  it("renders the active and preview model matrix with compare actions", async () => {
    render(await ProviderPage({ params: Promise.resolve({ providerSlug: "google" }) }));

    expect(screen.getByRole("heading", { level: 1, name: /Google AI API pricing/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Gemini 3.8 Flash details/i })).toHaveAttribute(
      "href",
      "/models/gemini-3.8-flash",
    );
    expect(screen.getByRole("link", { name: /compare Gemini 3.1 Pro/i })).toHaveAttribute(
      "href",
      expect.stringContaining("models=gemini-3.1-pro-preview"),
    );
    expect(screen.getByText(/^preview$/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /all pricing changes/i })).toHaveAttribute("href", "/changes");
  });

  it("builds factual provider metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ providerSlug: "google" }),
    });

    expect(metadata.title).toBe("Google AI API pricing");
    expect(metadata.description).toContain("2 priced models");
  });

  it("returns a standard Next.js 404 for an unknown provider", async () => {
    try {
      await ProviderPage({ params: Promise.resolve({ providerSlug: "missing-provider" }) });
      throw new Error("expected notFound");
    } catch (error) {
      expect((error as { digest?: string }).digest).toContain("NEXT_HTTP_ERROR_FALLBACK;404");
    }
  });
});