import { describe, expect, it } from "vitest";

import { MAX_TOKEN_QUANTITY, parseTokenQuantity } from "./quantity";

describe("parseTokenQuantity", () => {
  it.each([
    ["0", 0n],
    ["42", 42n],
    ["250K", 250_000n],
    ["3m", 3_000_000n],
    ["1.5B", 1_500_000_000n],
    [" 2.25 M ", 2_250_000n],
  ])("parses %s into an exact token count", (input, expected) => {
    expect(parseTokenQuantity(input)).toBe(expected);
  });

  it.each(["", "-1", "1e6", "1.2.3M", "ten", "1KB", ".5M"])(
    "rejects malformed quantity %s",
    (input) => {
      expect(() => parseTokenQuantity(input)).toThrow(/token quantity/i);
    },
  );

  it("rejects values above the configured upper bound", () => {
    expect(() => parseTokenQuantity((MAX_TOKEN_QUANTITY + 1n).toString())).toThrow(
      /maximum/i,
    );
  });
});
