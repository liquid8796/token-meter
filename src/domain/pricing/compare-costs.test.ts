import { describe, expect, it } from "vitest";

import { compareCosts } from "./compare-costs";

describe("compareCosts", () => {
  it("orders models by cost and reports the delta from the cheapest", () => {
    expect(
      compareCosts([
        { key: "premium", totalCost: "25.5" },
        { key: "budget", totalCost: "10" },
        { key: "mid", totalCost: "17.25" },
      ]),
    ).toEqual([
      {
        key: "budget",
        totalCost: "10",
        deltaFromCheapest: "0",
        isCheapest: true,
      },
      {
        key: "mid",
        totalCost: "17.25",
        deltaFromCheapest: "7.25",
        isCheapest: false,
      },
      {
        key: "premium",
        totalCost: "25.5",
        deltaFromCheapest: "15.5",
        isCheapest: false,
      },
    ]);
  });

  it("marks equal-cost ties as cheapest and orders ties deterministically by key", () => {
    expect(
      compareCosts([
        { key: "z-model", totalCost: "4.2" },
        { key: "a-model", totalCost: "4.2" },
      ]),
    ).toEqual([
      {
        key: "a-model",
        totalCost: "4.2",
        deltaFromCheapest: "0",
        isCheapest: true,
      },
      {
        key: "z-model",
        totalCost: "4.2",
        deltaFromCheapest: "0",
        isCheapest: true,
      },
    ]);
  });

  it("returns an empty comparison for no models", () => {
    expect(compareCosts([])).toEqual([]);
  });
});
