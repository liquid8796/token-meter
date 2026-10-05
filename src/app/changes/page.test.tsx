import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ChangesPage, { metadata } from "./page";

describe("pricing changes route", () => {
  it("renders the bounded pricing ledger shell", async () => {
    render(await ChangesPage());

    expect(screen.getByRole("heading", { level: 1, name: /pricing change ledger/i })).toBeInTheDocument();
    expect(screen.getByText(/verified numeric rate changes/i)).toBeInTheDocument();
  });

  it("publishes a stable canonical route", () => {
    expect(new URL(String(metadata.alternates?.canonical)).pathname).toBe("/changes");
  });
});
