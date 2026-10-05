import Decimal from "decimal.js";

import type { MoneyValue } from "./types";

export function formatUsd(value: MoneyValue): string {
  const amount = new Decimal(value);
  const absolute = amount.abs();
  const fractionDigits = absolute.greaterThanOrEqualTo(1)
    ? 2
    : absolute.greaterThanOrEqualTo("0.01")
      ? 4
      : 8;

  return `$${amount.toFixed(fractionDigits)}`;
}

export function formatTokenQuantity(value: bigint): string {
  const absolute = value < 0n ? -value : value;
  const units: Array<[bigint, string]> = [
    [1_000_000_000n, "B"],
    [1_000_000n, "M"],
    [1_000n, "K"],
  ];

  for (const [divisor, suffix] of units) {
    if (absolute >= divisor) {
      const compact = new Decimal(value.toString())
        .div(divisor.toString())
        .toDecimalPlaces(2)
        .toString();

      return `${compact}${suffix}`;
    }
  }

  return value.toString();
}
