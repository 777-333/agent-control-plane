// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SwarmReportingPanel } from "./SwarmReportingPanel";
import type { SwarmReportingMetricKey } from "@/lib/swarm-insights";

const { toastError, buildSwarmReportPdfBlob, toastInfo } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  buildSwarmReportPdfBlob: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
    info: toastInfo,
  },
}));

vi.mock("@/lib/swarm-report-export", async () => {
  const actual = await vi.importActual<typeof import("@/lib/swarm-report-export")>("@/lib/swarm-report-export");
  return {
    ...actual,
    buildSwarmReportPdfBlob,
  };
});

function createSwarm() {
  const now = Date.now();
  return {
    id: 7,
    name: "Finance Control Swarm",
    objective: "Koordiniert Freigaben und Eskalationen für sensible Budgetentscheidungen.",
    governance: {
      reportingWindowHours: 24,
      slaMinutes: 20,
      escalationAfterMinutes: 45,
    },
    communicationLinks: [
      {
        id: 11,
        fromAgentName: "Finance Sentinel",
        toAgentName: "Support Orchestrator",
        status: "healthy",
        lastMessageAt: now - 10 * 60_000,
        history: [
          { id: 1, senderAgentName: "Finance Sentinel", content: "Statusupdate dokumentiert.", kind: "status" as const, createdAt: now - 5 * 60_000 },
          { id: 2, senderAgentName: "Support Orchestrator", content: "Approval durch CFO erteilt.", kind: "approval" as const, createdAt: now - 4 * 60_000 },
        ],
      },
      {
        id: 12,
        fromAgentName: "Risk Analyst",
        toAgentName: "Finance Sentinel",
        status: "warning",
        lastMessageAt: now - 60 * 60_000,
        history: [
          { id: 3, senderAgentName: "Risk Analyst", content: "Evidence archiviert.", kind: "evidence" as const, createdAt: now - 30 * 60_000 },
        ],
      },
    ],
  };
}

function Harness() {
  const [metric, setMetric] = React.useState<SwarmReportingMetricKey>("messages");
  const [selectedLinkId, setSelectedLinkId] = React.useState<number | null>(null);
  return (
    <SwarmReportingPanel
      swarm={createSwarm()}
      selectedMetric={metric}
      selectedLinkId={selectedLinkId}
      onSelectMetric={setMetric}
      onSelectLink={setSelectedLinkId}
    />
  );
}

describe("SwarmReportingPanel", () => {
  beforeEach(() => {
    toastError.mockReset();
    toastInfo.mockReset();
    buildSwarmReportPdfBlob.mockReset();
  });

  it("rendert Reporting-Kennzahlen und wechselt den aktiven Reporting-Kontext per Benutzerinteraktion", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByText("Nachrichtenfenster")).toBeInTheDocument();
    expect(screen.getByText("Approval-Ereignisse")).toBeInTheDocument();
    expect(screen.getByText("SLA verletzt")).toBeInTheDocument();
    expect(screen.getByText("Ø Reaktionsalter")).toBeInTheDocument();
    expect(screen.getByTestId("swarm-reporting-context-7")).toHaveTextContent("Aktiver Reporting-Kontext: Nachrichtenfenster");

    await user.click(screen.getByRole("button", { name: /SLA verletzt/i }));

    expect(screen.getByTestId("swarm-reporting-context-7")).toHaveTextContent("Aktiver Reporting-Kontext: SLA verletzt · 1 betroffene Pfade");
    expect(screen.getByRole("button", { name: /SLA verletzt/i })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /Approval-Ereignisse/i }));

    expect(screen.getByTestId("swarm-reporting-context-7")).toHaveTextContent("Aktiver Reporting-Kontext: Approval-Ereignisse · 1 betroffene Pfade");
    expect(screen.getByRole("button", { name: /Approval-Ereignisse/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("meldet einen sichtbaren Fehler, wenn der CSV-Download scheitert", async () => {
    const user = userEvent.setup();
    const originalCreateObjectUrl = URL.createObjectURL;
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => { throw new Error("blocked"); }), revokeObjectURL: vi.fn() });

    render(<Harness />);
    await user.click(screen.getAllByRole("button", { name: /CSV exportieren/i })[0]);

    expect(toastError).toHaveBeenCalledWith("Der CSV-Report konnte nicht erstellt werden.");

    vi.stubGlobal("URL", { ...URL, createObjectURL: originalCreateObjectUrl, revokeObjectURL: URL.revokeObjectURL });
  });

  it("zeigt bei nicht-werfender Download-Auslösung einen sichtbaren Fallback-Link und Nutzerhinweis für CSV und PDF", async () => {
    const user = userEvent.setup();
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:report"), revokeObjectURL: vi.fn() });
    buildSwarmReportPdfBlob.mockResolvedValueOnce(new Blob(["pdf"], { type: "application/pdf" }));

    render(<Harness />);

    await user.click(screen.getAllByRole("button", { name: /CSV exportieren/i })[0]);
    expect(screen.getByTestId("swarm-export-fallback-7")).toHaveTextContent("CSV direkt herunterladen");
    expect(toastInfo).toHaveBeenCalledWith("Falls der CSV-Download nicht startet, nutzen Sie den direkten Fallback-Link.");

    await user.click(screen.getAllByRole("button", { name: /PDF herunterladen/i })[0]);
    expect(buildSwarmReportPdfBlob).toHaveBeenCalled();
    expect(screen.getByTestId("swarm-export-fallback-7")).toHaveTextContent("PDF direkt herunterladen");
    expect(toastInfo).toHaveBeenCalledWith("Falls der PDF-Download nicht startet, nutzen Sie den direkten Fallback-Link.");

    vi.stubGlobal("URL", { ...URL, createObjectURL: originalCreateObjectUrl, revokeObjectURL: originalRevokeObjectUrl });
  });

  it("meldet einen sichtbaren Fehler, wenn der PDF-Download scheitert", async () => {
    const user = userEvent.setup();
    buildSwarmReportPdfBlob.mockRejectedValueOnce(new Error("save failed"));

    render(<Harness />);
    await user.click(screen.getAllByRole("button", { name: /PDF herunterladen/i })[0]);

    expect(buildSwarmReportPdfBlob).toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Der PDF-Report konnte nicht erzeugt werden.");
  });
});
