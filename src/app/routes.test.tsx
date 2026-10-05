import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AboutPage from "./about/page";
import ComparePage from "./compare/page";
import ModelsPage from "./models/page";
import PrivacyPage from "./privacy/page";

describe("public navigation routes", () => {
  it("renders the model catalogue", async () => {
    render(await ModelsPage());
    expect(screen.getByRole("heading", { level: 1, name: /model pricing catalogue/i })).toBeInTheDocument();
    expect(screen.getAllByRole("article").length).toBeGreaterThanOrEqual(7);
  });

  it("renders the full comparison instrument", async () => {
    render(await ComparePage());
    expect(screen.getByRole("heading", { level: 1, name: /compare ai model costs/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly input tokens/i)).toBeInTheDocument();
  });

  it("renders methodology and privacy information", () => {
    const { unmount } = render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1, name: /how tokenmeter estimates cost/i })).toBeInTheDocument();
    unmount();

    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { level: 1, name: /privacy by design/i })).toBeInTheDocument();
  });
});
