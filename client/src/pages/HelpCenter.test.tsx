import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HelpCenterPage from "./HelpCenter";

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/help", setLocation],
}));

describe("HelpCenterPage", () => {
  beforeEach(() => {
    setLocation.mockReset();
  });

  it("zeigt den Schnellstart und alle zentralen Modulwegweiser an", () => {
    render(<HelpCenterPage />);

    expect(screen.getByText(/verständliche orientierung für den täglichen umgang/i)).toBeInTheDocument();
    expect(screen.getByText("Schnellstart für neue Nutzer")).toBeInTheDocument();
    expect(screen.getByText("Agenten-Verwaltung")).toBeInTheDocument();
    expect(screen.getByText("Policy Engine")).toBeInTheDocument();
    expect(screen.getByText("docs/handbuch-agenten-verwaltung.md")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Modul öffnen" }).length).toBeGreaterThan(5);
  });

  it("öffnet Tour und Modulnavigation über die vorgesehenen Aktionen", async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    render(<HelpCenterPage />);

    await user.click(screen.getByRole("button", { name: /starttour erneut öffnen/i }));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));

    await user.click(screen.getAllByRole("button", { name: "Modul öffnen" })[0]);
    expect(setLocation).toHaveBeenCalledWith("/");

    dispatchSpy.mockRestore();
  });
});
