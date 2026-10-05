import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PriceChangeFeedState } from "./load-price-changes";
import { PriceChangeLedger } from "./price-change-ledger";

const state: PriceChangeFeedState = {
  status: "ready",
  items: [
    {
      modelId: "model-gemini-3-8-flash",
      modelName: "Gemini 3.8 Flash",
      modelSlug: "gemini-3.8-flash",
      providerId: "provider-google",
      providerName: "Google",
      providerSlug: "google",
      previousPricingId: "price-old",
      pricingId: "price-new",
      effectiveFrom: "2027-01-01T00:00:00.000Z",
      effectiveFromBasis: "official",
      verifiedAt: "2026-10-05T00:00:00.000Z",
      sourceUrl: "https://ai.google.dev/pricing",
      band: {
        unitTokens: 1_000_000n,
        minInputTokensPerRequest: 0n,
        maxInputTokensPerRequest: null,
      },
      changes: [
        {
          dimension: "inputPerUnit",
          previous: "0.75",
          current: "1.5",
          percentageDelta: "100",
        },
      ],
    },
  ],
};

describe("PriceChangeLedger", () => {
  it("renders source-backed effective semantics, rate delta and model/source links", () => {
    render(<PriceChangeLedger state={state} />);

    expect(screen.getByText(/effective jan 1, 2027/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gemini 3.8 Flash" })).toHaveAttribute(
      "href",
      "/models/gemini-3.8-flash",
    );
    expect(screen.getByText(/input/i)).toBeInTheDocument();
    expect(screen.getByText(/\$0\.75/)).toBeInTheDocument();
    expect(screen.getByText(/\$1\.50/)).toBeInTheDocument();
    expect(screen.getByText(/\+100%/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /official source/i })).toHaveAttribute(
      "href",
      "https://ai.google.dev/pricing",
    );
  });

  it("renders explicit history unavailability instead of synthetic changes", () => {
    render(<PriceChangeLedger state={{ status: "unavailable", items: [] }} />);

    expect(screen.getByText(/pricing history is temporarily unavailable/i)).toBeInTheDocument();
  });
});
