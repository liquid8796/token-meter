import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PricingBand, Workload } from "@/domain/pricing/types";
import { OptimizerPanel } from "./optimizer-panel";

const band: PricingBand = {
  unitTokens: 1_000_000n,
  minInputTokensPerRequest: 0n,
  maxInputTokensPerRequest: null,
  inputPerUnit: "2",
  outputPerUnit: "10",
  cachedInputPerUnit: "0.2",
  batchInputPerUnit: "1",
  batchOutputPerUnit: "5",
};

const cachedWorkload: Workload = {
  inputTokens: 10_000_000n,
  outputTokens: 2_000_000n,
  cachedInputTokens: 4_000_000n,
};

const regularWorkload: Workload = { ...cachedWorkload, cachedInputTokens: 0n };

describe("OptimizerPanel", () => {
  it("shows source-backed cache savings for a cached workload", () => {
    render(<OptimizerPanel modelName="Test Model" workload={cachedWorkload} band={band} />);

    expect(screen.getByText(/^cache-read$/i)).toBeInTheDocument();
    expect(screen.getByText(/save \$7\.20/i)).toBeInTheDocument();
    expect(screen.getByText(/18%/i)).toBeInTheDocument();
  });

  it("shows asynchronous batch savings only for compatible workloads", () => {
    render(<OptimizerPanel modelName="Test Model" workload={regularWorkload} band={band} />);

    expect(screen.getByText(/^batch$/i)).toBeInTheDocument();
    expect(screen.getByText(/asynchronous/i)).toBeInTheDocument();
    expect(screen.getByText(/save \$20\.00/i)).toBeInTheDocument();
  });

  it("does not turn missing published rates into free savings", () => {
    render(
      <OptimizerPanel
        modelName="Test Model"
        workload={cachedWorkload}
        band={{ ...band, cachedInputPerUnit: undefined, batchInputPerUnit: undefined, batchOutputPerUnit: undefined }}
      />,
    );

    expect(screen.getByText(/published cache-read rate unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/batch \+ cache comparison unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/save \$0\.00/i)).not.toBeInTheDocument();
  });

  it("explains why cached workloads do not show synthetic batch savings", () => {
    render(<OptimizerPanel modelName="Test Model" workload={cachedWorkload} band={band} />);

    expect(screen.getByText(/batch \+ cache comparison unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/no published comparable batch-cache rate/i)).toBeInTheDocument();
  });
});
