import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Calculator, type CalculatorModel } from "./calculator";

const models: CalculatorModel[] = [
  {
    slug: "fast",
    name: "Fast Model",
    provider: "Alpha",
    status: "active",
    contextWindowTokens: "1000000",
    sourceUrl: "https://example.com/fast",
    verifiedAt: "2026-10-05T00:00:00.000Z",
    bands: [
      {
        unitTokens: "1000000",
        minInputTokensPerRequest: "0",
        maxInputTokensPerRequest: null,
        inputPerUnit: "1",
        outputPerUnit: "4",
        cachedInputPerUnit: "0.1",
      },
    ],
  },
  {
    slug: "tiered",
    name: "Tiered Model",
    provider: "Beta",
    status: "active",
    contextWindowTokens: "1000000",
    sourceUrl: "https://example.com/tiered",
    verifiedAt: "2026-10-05T00:00:00.000Z",
    bands: [
      {
        unitTokens: "1000000",
        minInputTokensPerRequest: "0",
        maxInputTokensPerRequest: "200000",
        inputPerUnit: "2",
        outputPerUnit: "8",
        cachedInputPerUnit: "0.2",
      },
      {
        unitTokens: "1000000",
        minInputTokensPerRequest: "200001",
        maxInputTokensPerRequest: null,
        inputPerUnit: "4",
        outputPerUnit: "12",
        cachedInputPerUnit: "0.4",
      },
    ],
  },
  ...["three", "four", "five"].map(
    (slug, index): CalculatorModel => ({
      slug,
      name: `Model ${index + 3}`,
      provider: "Gamma",
      status: "active",
      contextWindowTokens: "1000000",
      sourceUrl: `https://example.com/${slug}`,
      verifiedAt: "2026-10-05T00:00:00.000Z",
      bands: [
        {
          unitTokens: "1000000",
          minInputTokensPerRequest: "0",
          maxInputTokensPerRequest: null,
          inputPerUnit: "3",
          outputPerUnit: "9",
        },
      ],
    }),
  ),
];

describe("Calculator", () => {
  it("recalculates visible cost when workload changes", async () => {
    const user = userEvent.setup();
    render(<Calculator models={models} initialSelectedSlugs={["fast"]} />);

    const result = screen.getByTestId("result-fast");
    expect(within(result).getByText("$9.00")).toBeInTheDocument();

    const input = screen.getByLabelText(/monthly input tokens/i);
    await user.clear(input);
    await user.type(input, "2M");

    expect(within(result).getByText("$10.00")).toBeInTheDocument();
  });

  it("keeps the last valid result visible when an input becomes invalid", async () => {
    const user = userEvent.setup();
    render(<Calculator models={models} initialSelectedSlugs={["fast"]} />);

    const result = screen.getByTestId("result-fast");
    expect(within(result).getByText("$9.00")).toBeInTheDocument();

    const input = screen.getByLabelText(/monthly input tokens/i);
    await user.clear(input);
    await user.type(input, "oops");

    expect(screen.getByText(/enter a token quantity/i)).toBeInTheDocument();
    expect(within(result).getByText("$9.00")).toBeInTheDocument();
  });

  it("shows cached input only when a selected model supports cache reads", async () => {
    const user = userEvent.setup();
    render(<Calculator models={models} initialSelectedSlugs={["three"]} />);

    expect(screen.queryByLabelText(/cached input tokens/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /fast model/i }));
    expect(screen.getByLabelText(/cached input tokens/i)).toBeInTheDocument();
  });

  it("uses average request context to select a higher pricing band", async () => {
    const user = userEvent.setup();
    render(<Calculator models={models} initialSelectedSlugs={["tiered"]} />);

    const result = screen.getByTestId("result-tiered");
    expect(within(result).getByText("$18.00")).toBeInTheDocument();

    const context = screen.getByLabelText(/average input tokens per request/i);
    await user.clear(context);
    await user.type(context, "300K");

    expect(within(result).getByText("$28.00")).toBeInTheDocument();
  });

  it("limits comparison selection to four models", async () => {
    const user = userEvent.setup();
    render(
      <Calculator
        models={models}
        initialSelectedSlugs={["fast", "tiered", "three", "four"]}
      />,
    );

    const fifth = screen.getByRole("checkbox", { name: /model 5/i });
    expect(fifth).toBeDisabled();
    await user.click(fifth);
    expect(screen.getAllByTestId(/^result-/)).toHaveLength(4);
  });
  it("hydrates selection and workload from an initial scenario", () => {
    render(
      <Calculator
        models={models}
        initialScenario={{
          modelSlugs: ["tiered", "fast"],
          inputText: "3M",
          outputText: "750K",
          cachedText: "500K",
          contextText: "300K",
          presetSlug: "custom",
        }}
      />,
    );

    expect(screen.getByLabelText(/monthly input tokens/i)).toHaveValue("3M");
    expect(screen.getByLabelText(/monthly output tokens/i)).toHaveValue("750K");
    expect(screen.getByLabelText(/average input tokens per request/i)).toHaveValue("300K");
    expect(screen.getByRole("checkbox", { name: /tiered model/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /fast model/i })).toBeChecked();
  });

  it("applies a workload preset and manual edits switch it to custom", async () => {
    const user = userEvent.setup();
    const onScenarioChange = vi.fn();
    render(<Calculator models={models} initialSelectedSlugs={["fast"]} onScenarioChange={onScenarioChange} />);

    await user.selectOptions(screen.getByLabelText(/workload preset/i), "rag");
    expect(screen.getByLabelText(/monthly input tokens/i)).toHaveValue("12M");
    expect(screen.getByLabelText(/monthly output tokens/i)).toHaveValue("2M");
    expect(screen.getByLabelText(/average input tokens per request/i)).toHaveValue("32K");
    expect(onScenarioChange).toHaveBeenLastCalledWith(expect.objectContaining({ presetSlug: "rag" }));

    const input = screen.getByLabelText(/monthly input tokens/i);
    await user.clear(input);
    await user.type(input, "13M");
    expect(screen.getByLabelText(/workload preset/i)).toHaveValue("custom");
    expect(onScenarioChange).toHaveBeenLastCalledWith(expect.objectContaining({
      inputText: "13M",
      presetSlug: "custom",
    }));
  });
});
