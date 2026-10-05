import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { BudgetCalculator, type BudgetModel } from "./budget-calculator";

const models: BudgetModel[] = [
  {
    pricingId: "price-fast",
    slug: "fast",
    name: "Fast Model",
    provider: "Alpha",
    sourceUrl: "https://example.com/fast",
    verifiedAt: "2026-10-05T00:00:00.000Z",
    bands: [
      {
        unitTokens: "1000000",
        minInputTokensPerRequest: "0",
        maxInputTokensPerRequest: null,
        inputPerUnit: "2",
        outputPerUnit: "10",
        cachedInputPerUnit: "0.2",
      },
    ],
  },
  {
    pricingId: "price-tiered",
    slug: "tiered",
    name: "Tiered Model",
    provider: "Beta",
    sourceUrl: "https://example.com/tiered",
    verifiedAt: "2026-10-05T00:00:00.000Z",
    bands: [
      {
        unitTokens: "1000000",
        minInputTokensPerRequest: "0",
        maxInputTokensPerRequest: "200000",
        inputPerUnit: "2",
        outputPerUnit: "10",
      },
      {
        unitTokens: "1000000",
        minInputTokensPerRequest: "200001",
        maxInputTokensPerRequest: null,
        inputPerUnit: "4",
        outputPerUnit: "18",
      },
    ],
  },
];

describe("BudgetCalculator", () => {
  it("scales a token mix and links the result into compare", async () => {
    const user = userEvent.setup();
    render(<BudgetCalculator models={models} />);

    await user.clear(screen.getByLabelText(/monthly budget/i));
    await user.type(screen.getByLabelText(/monthly budget/i), "70");
    await user.clear(screen.getByLabelText(/^input tokens per mix unit$/i));
    await user.type(screen.getByLabelText(/^input tokens per mix unit$/i), "1M");
    await user.clear(screen.getByLabelText(/^output tokens per mix unit$/i));
    await user.type(screen.getByLabelText(/^output tokens per mix unit$/i), "500K");

    expect(await screen.findByText(/10,000,000 input tokens/i)).toBeInTheDocument();
    const compare = screen.getByRole("link", { name: /compare this workload/i });
    expect(compare).toHaveAttribute("href", expect.stringContaining("/compare?"));
    expect(compare).toHaveAttribute("href", expect.stringContaining("input=10000000"));
    expect(compare).toHaveAttribute("href", expect.stringContaining("output=5000000"));
    expect(screen.getByRole("link", { name: /official pricing/i })).toHaveAttribute("href", "https://example.com/fast");
  });

  it("floors request capacity to whole requests", async () => {
    const user = userEvent.setup();
    render(<BudgetCalculator models={models} />);

    await user.selectOptions(screen.getByLabelText(/budget mode/i), "requests");
    await user.clear(screen.getByLabelText(/monthly budget/i));
    await user.type(screen.getByLabelText(/monthly budget/i), "10.9");
    await user.clear(screen.getByLabelText(/^input tokens per request$/i));
    await user.type(screen.getByLabelText(/^input tokens per request$/i), "500K");
    await user.clear(screen.getByLabelText(/^output tokens per request$/i));
    await user.type(screen.getByLabelText(/^output tokens per request$/i), "500K");

    expect(await screen.findByText(/1 request/i)).toBeInTheDocument();
  });

  it("selects the long-context rate for budget planning", async () => {
    const user = userEvent.setup();
    render(<BudgetCalculator models={models} />);

    await user.selectOptions(screen.getByLabelText(/model/i), "tiered");
    await user.clear(screen.getByLabelText(/monthly budget/i));
    await user.type(screen.getByLabelText(/monthly budget/i), "40");
    await user.clear(screen.getByLabelText(/^input tokens per mix unit$/i));
    await user.type(screen.getByLabelText(/^input tokens per mix unit$/i), "1M");
    await user.clear(screen.getByLabelText(/^output tokens per mix unit$/i));
    await user.type(screen.getByLabelText(/^output tokens per mix unit$/i), "0");
    await user.clear(screen.getByLabelText(/average input tokens per request/i));
    await user.type(screen.getByLabelText(/average input tokens per request/i), "300K");

    expect(await screen.findByText(/10,000,000 input tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/200,001\+ context band/i)).toBeInTheDocument();
  });

  it("shows bounded unavailable state for invalid budgets instead of Infinity or NaN", async () => {
    const user = userEvent.setup();
    render(<BudgetCalculator models={models} />);

    await user.clear(screen.getByLabelText(/monthly budget/i));
    await user.type(screen.getByLabelText(/monthly budget/i), "1e100");

    expect(screen.getByRole("alert")).toHaveTextContent(/valid budget and supported rates/i);
    expect(screen.queryByText(/Infinity|NaN/)).not.toBeInTheDocument();
  });
});
