// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FirstRunTour from "./FirstRunTour";

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/", setLocation],
}));

describe("FirstRunTour", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setLocation.mockReset();
  });

  it("öffnet sich für Erstnutzer automatisch und führt per Schrittaktion zur passenden Oberfläche", async () => {
    const user = userEvent.setup();
    render(<FirstRunTour userName="Alex" />);

    expect(screen.getByText(/willkommen, alex/i)).toBeInTheDocument();
    expect(screen.getAllByText(/mit dem dashboard starten/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Weiter" }));

    expect(screen.getAllByText(/danach die agenten prüfen/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /agenten-verwaltung öffnen/i }));
    expect(setLocation).toHaveBeenCalledWith("/agents");

    await user.click(screen.getByRole("button", { name: /später schließen/i }));
    expect(window.localStorage.getItem("agent-control-plane:first-run-tour-completed")).toBe("true");
  });

  it("kann nachträglich erneut über das globale Tour-Ereignis geöffnet werden", async () => {
    const user = userEvent.setup();
    render(<FirstRunTour userName="Alex" />);

    await user.click(screen.getByRole("button", { name: /später schließen/i }));
    expect(window.localStorage.getItem("agent-control-plane:first-run-tour-completed")).toBe("true");

    window.dispatchEvent(new CustomEvent("agent-control-plane:start-tour"));

    await waitFor(() => {
      expect(screen.getByText(/starttour für erstnutzer/i)).toBeVisible();
    });
  });
});
