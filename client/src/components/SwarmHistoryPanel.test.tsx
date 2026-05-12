// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SwarmHistoryPanel, type SwarmHistoryPanelLink } from "./SwarmHistoryPanel";
import { SwarmReportingPanel } from "./SwarmReportingPanel";
import type { SwarmHistoryFilter, SwarmReportingMetricKey } from "@/lib/swarm-insights";

function createLink(): SwarmHistoryPanelLink {
  return {
    id: 21,
    fromAgentId: 1,
    toAgentId: 2,
    fromAgentName: "Finance Sentinel",
    toAgentName: "Support Orchestrator",
    channel: "approval-context",
    protocol: "event_bus",
    purpose: "Überträgt Freigabekontext für sensible Kundenmaßnahmen.",
    status: "healthy",
    lastMessageAt: Date.now() - 60_000,
    history: [
      {
        id: 1,
        senderAgentName: "Finance Sentinel",
        content: "Budgetreview abgeschlossen und dokumentiert.",
        kind: "status",
        createdAt: Date.now() - 5 * 60_000,
      },
      {
        id: 2,
        senderAgentName: "Support Orchestrator",
        content: "Approval durch CFO erforderlich.",
        kind: "approval",
        createdAt: Date.now() - 4 * 60_000,
      },
      {
        id: 3,
        senderAgentName: "Risk Analyst",
        content: "Evidence für Eskalation archiviert.",
        kind: "evidence",
        createdAt: Date.now() - 3 * 60_000,
      },
    ],
  };
}

function Harness() {
  const [filter, setFilter] = React.useState<SwarmHistoryFilter>({ query: "", kind: "all" });
  const [draft, setDraft] = React.useState("");
  const [metric, setMetric] = React.useState<SwarmReportingMetricKey>("messages");
  const [selectedLinkId, setSelectedLinkId] = React.useState<number | null>(null);
  const link = createLink();

  return (
    <div>
      <SwarmReportingPanel
        swarm={{
          id: 7,
          governance: {
            reportingWindowHours: 24,
            slaMinutes: 20,
            escalationAfterMinutes: 45,
          },
          communicationLinks: [link],
        }}
        selectedMetric={metric}
        selectedLinkId={selectedLinkId}
        onSelectMetric={setMetric}
        onSelectLink={setSelectedLinkId}
      />
      <SwarmHistoryPanel
        link={link}
        filter={filter}
        draft={draft}
        timeAgo={() => "vor 5 Min."}
        onFilterChange={setFilter}
        onDraftChange={setDraft}
        onSubmit={vi.fn()}
      />
    </div>
  );
}

import React from "react";

describe("SwarmHistoryPanel", () => {
  it("verifiziert in einem gemeinsamen UI-Ablauf Such-/Typfilter und den aktiven Reporting-Kontext der Schwarmkarte", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByText("3 von 3 Einträgen sichtbar")).toBeInTheDocument();
    expect(screen.getByTestId("swarm-filter-context-21")).toHaveTextContent("Alle Typen · ohne Suchbegriff");

    await user.type(screen.getByLabelText("Verlauf durchsuchen"), "cfo");

    expect(screen.getByText("1 von 3 Einträgen sichtbar")).toBeInTheDocument();
    expect(screen.getByText("Approval durch CFO erforderlich.")).toBeInTheDocument();
    expect(screen.queryByText("Budgetreview abgeschlossen und dokumentiert.")).not.toBeInTheDocument();
    expect(screen.getByTestId("swarm-filter-context-21")).toHaveTextContent("Alle Typen · Suche „cfo“");

    await user.selectOptions(screen.getByLabelText("Nachrichtentyp filtern"), "approval");

    expect(screen.getByText("1 von 3 Einträgen sichtbar")).toBeInTheDocument();
    expect(screen.getByTestId("swarm-filter-context-21")).toHaveTextContent("Typ approval · Suche „cfo“");

    await user.clear(screen.getByLabelText("Verlauf durchsuchen"));
    await user.selectOptions(screen.getByLabelText("Nachrichtentyp filtern"), "evidence");

    expect(screen.getByText("1 von 3 Einträgen sichtbar")).toBeInTheDocument();
    expect(screen.getByText("Evidence für Eskalation archiviert.")).toBeInTheDocument();
    expect(screen.getByTestId("swarm-filter-context-21")).toHaveTextContent("Typ evidence · ohne Suchbegriff");

    await user.click(screen.getByRole("button", { name: /Approval-Ereignisse/i }));

    expect(screen.getByTestId("swarm-reporting-context-7")).toHaveTextContent("Aktiver Reporting-Kontext: Approval-Ereignisse · 1 betroffene Pfade");
    expect(screen.getByRole("button", { name: /Approval-Ereignisse/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("entfernt harte Mindestbreiten aus Filter- und Composer-Bereichen, damit schmale linke Spalten nicht überlaufen", () => {
    render(<Harness />);

    const historyCard = screen.getAllByTestId("swarm-link-21")[0];
    expect(historyCard.className).toContain("min-w-0");

    const searchGrid = screen.getAllByLabelText("Verlauf durchsuchen")[0].parentElement as HTMLElement;
    expect(searchGrid.className).toContain("min-w-0");
    expect(searchGrid.className).not.toContain("lg:min-w-[320px]");

    const composerGrid = screen.getAllByPlaceholderText(/Neue Nachricht für diesen Pfad dokumentieren/i)[0].parentElement as HTMLElement;
    expect(composerGrid.className).toContain("min-w-0");
    expect(composerGrid.className).toContain("xl:grid-cols-[minmax(0,1fr)_200px]");
  });
});
