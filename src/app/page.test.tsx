import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("TokenMeter home page", () => {
  it("opens with the TokenMeter identity and a calculator-first promise", () => {
    render(<HomePage />);

    expect(screen.getByText("TokenMeter")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /price your ai workload before it reaches production/i,
      }),
    ).toBeInTheDocument();
  });
});
