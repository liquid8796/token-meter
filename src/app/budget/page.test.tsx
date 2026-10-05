import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BudgetPage, { metadata } from "./page";

describe("budget route", () => {
  it("renders a source-backed budget instrument", async () => {
    render(await BudgetPage());
    expect(screen.getByRole("heading", { name: /turn a monthly ai budget into usable capacity/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly budget/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /official pricing/i })).toBeInTheDocument();
  });

  it("keeps a stable canonical route", () => {
    expect(new URL(String(metadata.alternates?.canonical)).pathname).toBe("/budget");
  });
});
