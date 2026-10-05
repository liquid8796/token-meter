import type { PricingBand, SelectedPricingBand } from "./types";

function compareBandFloor(left: PricingBand, right: PricingBand) {
  if (left.minInputTokensPerRequest < right.minInputTokensPerRequest) {
    return -1;
  }

  if (left.minInputTokensPerRequest > right.minInputTokensPerRequest) {
    return 1;
  }

  return 0;
}

function includesContext(band: PricingBand, inputTokensPerRequest: bigint) {
  const withinFloor = inputTokensPerRequest >= band.minInputTokensPerRequest;
  const withinCeiling =
    band.maxInputTokensPerRequest === null ||
    inputTokensPerRequest <= band.maxInputTokensPerRequest;

  return withinFloor && withinCeiling;
}

export function selectPricingBand(
  bands: PricingBand[],
  averageInputTokensPerRequest?: bigint,
): SelectedPricingBand {
  if (bands.length === 0) {
    throw new Error("No pricing bands are configured");
  }

  const sortedBands = [...bands].sort(compareBandFloor);

  if (averageInputTokensPerRequest === undefined) {
    return { band: sortedBands[0], assumption: "base-band" };
  }

  if (averageInputTokensPerRequest < 0n) {
    throw new Error("Request context cannot be negative");
  }

  const matchingBand = sortedBands.find((band) =>
    includesContext(band, averageInputTokensPerRequest),
  );

  if (!matchingBand) {
    throw new Error("No pricing band matches this request context");
  }

  return { band: matchingBand, assumption: null };
}
