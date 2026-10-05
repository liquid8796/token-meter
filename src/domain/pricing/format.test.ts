import { describe, expect, it } from "vitest";

import { formatTokenQuantity, formatUsd } from "./format";

describe("formatUsd", () => {
  it.each([
    ["14", "$14.00"],
    ["3.4", "$3.40"],
    ["0.125", "$0.1250"],
    ["0.0000001", "$0.00000010"],
  ])("formats %s with useful cost precision", (value, expected) => {
    expect(formatUsd(value)).toBe(expected);
  });
});

describe("formatTokenQuantity", () => {
  it.each([
    [999n, "999"],
    [1_500n, "1.5K"],
    [2_000_000n, "2M"],
    [1_250_000_000n, "1.25B"],
  ])("formats %s compactly", (value, expected) => {
    expect(formatTokenQuantity(value)).toBe(expected);
  });
});
