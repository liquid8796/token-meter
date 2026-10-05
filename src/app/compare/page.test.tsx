import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import ComparePage from "./page";

describe("compare route scenarios", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/compare");
  });

  it("hydrates a safe deep-linked scenario", async () => {
    render(
      await ComparePage({
        searchParams: Promise.resolve({
          models: "gpt-6.1-sol,claude-sonnet-5-5,unknown",
          input: "3M",
          output: "750K",
          context: "64K",
          prompt: "must-not-survive",
        }),
      }),
    );

    expect(screen.getByLabelText(/monthly input tokens/i)).toHaveValue("3M");
    expect(screen.getByLabelText(/monthly output tokens/i)).toHaveValue("750K");
    expect(screen.getByLabelText(/average input tokens per request/i)).toHaveValue("64K");
    expect(screen.getByRole("checkbox", { name: /gpt-6\.1 sol/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /claude sonnet 5\.5/i })).toBeChecked();
  });

  it("keeps valid edits shareable and restores popstate scenarios", async () => {
    const user = userEvent.setup();
    render(await ComparePage({ searchParams: Promise.resolve({ models: "gpt-6.1-sol" }) }));

    const input = screen.getByLabelText(/monthly input tokens/i);
    await user.clear(input);
    await user.type(input, "4M");

    await waitFor(() => expect(window.location.search).toContain("input=4M"));
    expect(window.location.search).not.toMatch(/prompt|key|secret/i);

    window.history.pushState({}, "", "/compare?models=gpt-6.1-sol&input=7M&context=32K");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() => expect(screen.getByLabelText(/monthly input tokens/i)).toHaveValue("7M"));
    expect(screen.getByLabelText(/average input tokens per request/i)).toHaveValue("32K");

    await user.click(screen.getByRole("button", { name: /copy share link/i }));
    expect(await screen.findByText(/link copied/i)).toBeInTheDocument();
  });
});
