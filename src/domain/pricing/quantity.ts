export const MAX_TOKEN_QUANTITY = 1_000_000_000_000_000_000n;

const TOKEN_PATTERN = /^(\d+)(?:\.(\d+))?\s*([KMB])?$/i;

const MULTIPLIERS: Record<string, bigint> = {
  "": 1n,
  K: 1_000n,
  M: 1_000_000n,
  B: 1_000_000_000n,
};

export function parseTokenQuantity(input: string): bigint {
  const normalized = input.trim();
  const match = TOKEN_PATTERN.exec(normalized);

  if (!match) {
    throw new Error("Invalid token quantity");
  }

  const [, wholePart, fractionalPart = "", rawSuffix = ""] = match;
  const suffix = rawSuffix.toUpperCase();
  const multiplier = MULTIPLIERS[suffix];
  const scale = 10n ** BigInt(fractionalPart.length);
  const scaledValue = BigInt(`${wholePart}${fractionalPart}`);
  const scaledTokens = scaledValue * multiplier;

  if (scaledTokens % scale !== 0n) {
    throw new Error("Token quantity must resolve to a whole number of tokens");
  }

  const tokens = scaledTokens / scale;

  if (tokens > MAX_TOKEN_QUANTITY) {
    throw new Error("Token quantity exceeds maximum supported value");
  }

  return tokens;
}
