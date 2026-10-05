import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

describe("site discovery navigation", () => {
  it("links the primary navigation to compare, budget and pricing changes", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Compare" })).toHaveAttribute("href", "/compare");
    expect(screen.getByRole("link", { name: "Budget" })).toHaveAttribute("href", "/budget");
    expect(screen.getByRole("link", { name: "Changes" })).toHaveAttribute("href", "/changes");
  });

  it("keeps pricing changes discoverable from the footer", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "Changes" })).toHaveAttribute("href", "/changes");
  });
});
