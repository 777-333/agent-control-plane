// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SwarmReportingPanel } from "./SwarmReportingPanel";
import type { SwarmReportingMetricKey } from "@/lib/swarm-insights";

const { toastError, toastInfo, toastSuccess, buildSwarmReportPdfBlob } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  buildSwarmReportPdfBlob: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
    info: toastInfo,
    success: toastSuccess,
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

function createAutonomyRun(status: "running" | "awaiting_approval" = "running") {
  const now = Date.now();
  return {
    id: status === "running" ? 401 : 402,
    swarmId: 7,
    objective: status === "running" ? "Budgetabweichung analysieren und Maßnahmen koordinieren" : "Produktionsfreigabe für sensibles Finanzrouting vorbereiten",
    context: "CFO erwartet ein konsolidiertes Update mit Eskalationspfaden.",
    priority: status === "running" ? ("urgent" as const) : ("critical" as const),
    status,
    governanceStatus: status === "awaiting_approval" ? ("approval_required" as const) : ("clear" as const),
    requestedByLabel: "Ops Lead",
    requestedByRole: "admin" as const,
    summary: "Planner hat Teilaufgaben erzeugt und dem Schwarm zugewiesen.",
    startedAt: now - 8 * 60_000,
    completedAt: null,
    createdAt: now - 10 * 60_000,
    lastEventAt: now - 2 * 60_000,
    steps: [
      {
        id: 1,
        assignedAgentId: 91,
        assignedAgentName: "Finance Sentinel",
        title: "Abweichungen priorisieren",
        instructions: "Sammle Anomalien und ordne sie nach Risiko.",
        status: "in_progress" as const,
        sequence: 1,
        output: "Drei Hochrisiko-Fälle erkannt.",
        completedAt: null,
      },
      {
        id: 2,
        assignedAgentId: 92,
        assignedAgentName: "Risk Analyst",
        title: "Eskalationspfade bestätigen",
        instructions: "Verifiziere Ownership und Eskalationsgrenzen.",
        status: "pending" as const,
        sequence: 2,
        output: null,
        completedAt: null,
      },
    ],
    events: [
      {
        id: 1,
        stepId: null,
        eventType: "planned" as const,
        actorLabel: "Planner Node",
        detail: "Auftrag in zwei operative Schritte zerlegt.",
        createdAt: now - 7 * 60_000,
      },
      {
        id: 2,
        stepId: 1,
        eventType: "delegated" as const,
        actorLabel: "Supervisor",
        detail: "Analyse an Finance Sentinel delegiert.",
        createdAt: now - 6 * 60_000,
      },
    ],
  };
}

function Harness({
  currentUserRole = "admin" as const,
  autonomyRuns = [createAutonomyRun()],
  onCreateAutonomyRun = vi.fn(async () => undefined),
  onControlAutonomyRun = vi.fn(async () => undefined),
  onRequestDownload = vi.fn(async () => ({ status: "approved" as const })),
}: {
  currentUserRole?: "user" | "admin";
  autonomyRuns?: Array<ReturnType<typeof createAutonomyRun>>;
  onCreateAutonomyRun?: (payload: { objective: string; context?: string; priority: "standard" | "urgent" | "critical" }) => Promise<void>;
  onControlAutonomyRun?: (payload: { runId: number; action: "pause" | "resume" | "cancel" | "approve" }) => Promise<void>;
  onRequestDownload?: (payload: { format: "csv" | "pdf"; reason: string }) => Promise<{ status: "approved" | "pending" }>;
}) {
  const [metric, setMetric] = React.useState<SwarmReportingMetricKey>("messages");
  const [selectedLinkId, setSelectedLinkId] = React.useState<number | null>(null);
  return (
    <SwarmReportingPanel
      swarm={createSwarm()}
      selectedMetric={metric}
      selectedLinkId={selectedLinkId}
      currentUserRole={currentUserRole}
      autonomyRuns={autonomyRuns}
      onSelectMetric={setMetric}
      onSelectLink={setSelectedLinkId}
      onCreateAutonomyRun={onCreateAutonomyRun}
      onControlAutonomyRun={onControlAutonomyRun}
      onRequestDownload={onRequestDownload}
    />
  );
}

describe("SwarmReportingPanel", () => {
  beforeEach(() => {
    toastError.mockReset();
    toastInfo.mockReset();
    toastSuccess.mockReset();
    buildSwarmReportPdfBlob.mockReset();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => "blob:report"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => undefined),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rendert Reporting-Kennzahlen und wechselt den aktiven Reporting-Kontext per Benutzerinteraktion", () => {
    render(<Harness />);

    expect(screen.getByText("Nachrichtenfenster")).toBeInTheDocument();
    expect(screen.getByText("Approval-Ereignisse")).toBeInTheDocument();
    expect(screen.getByText("SLA verletzt")).toBeInTheDocument();
    expect(screen.getByText("Ø Reaktionsalter")).toBeInTheDocument();
    expect(screen.getByTestId("swarm-reporting-context-7")).toHaveTextContent("Aktiver Reporting-Kontext: Nachrichtenfenster");

    fireEvent.click(screen.getByRole("button", { name: /SLA verletzt/i }));
    expect(screen.getByTestId("swarm-reporting-context-7")).toHaveTextContent("Aktiver Reporting-Kontext: SLA verletzt · 1 betroffene Pfade");

    fireEvent.click(screen.getByRole("button", { name: /Approval-Ereignisse/i }));
    expect(screen.getByTestId("swarm-reporting-context-7")).toHaveTextContent("Aktiver Reporting-Kontext: Approval-Ereignisse · 1 betroffene Pfade");
  });

  it("meldet einen sichtbaren Fehler, wenn der CSV-Download scheitert", async () => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => {
        throw new Error("blocked");
      }),
    });

    render(<Harness />);
    fireEvent.click(screen.getAllByRole("button", { name: /CSV exportieren/i })[0]);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Der CSV-Report konnte nicht vorbereitet werden.");
    });
  });

  it("zeigt bei nicht-werfender Download-Auslösung einen sichtbaren Fallback-Link und Nutzerhinweis für CSV und PDF", async () => {
    buildSwarmReportPdfBlob.mockResolvedValueOnce(new Blob(["pdf"], { type: "application/pdf" }));

    render(<Harness />);

    fireEvent.click(screen.getAllByRole("button", { name: /CSV exportieren/i })[0]);
    await waitFor(() => {
      expect(screen.getByTestId("swarm-export-fallback-7")).toHaveTextContent("CSV direkt herunterladen");
      expect(toastInfo).toHaveBeenCalledWith("Falls der CSV-Download nicht startet, nutzen Sie den direkten Fallback-Link.");
    });

    fireEvent.click(screen.getAllByRole("button", { name: /PDF herunterladen/i })[0]);
    await waitFor(() => {
      expect(buildSwarmReportPdfBlob).toHaveBeenCalled();
      expect(screen.getByTestId("swarm-export-fallback-7")).toHaveTextContent("PDF direkt herunterladen");
      expect(toastInfo).toHaveBeenCalledWith("Falls der PDF-Download nicht startet, nutzen Sie den direkten Fallback-Link.");
    });
  });

  it("meldet einen sichtbaren Fehler, wenn der PDF-Download scheitert", async () => {
    buildSwarmReportPdfBlob.mockRejectedValueOnce(new Error("save failed"));

    render(<Harness />);
    fireEvent.click(screen.getAllByRole("button", { name: /PDF herunterladen/i })[0]);

    await waitFor(() => {
      expect(buildSwarmReportPdfBlob).toHaveBeenCalled();
      expect(toastError).toHaveBeenCalledWith("Der PDF-Report konnte nicht vorbereitet werden.");
    });
  });

  it("rendert im Autonomie-Panel die Eingabeflächen und Steueroptionen für neue Schwarmaufträge", () => {
    render(<Harness />);

    const autonomyPanel = screen.getAllByTestId("swarm-autonomy-panel-7")[0];
    const panelQueries = within(autonomyPanel);

    expect(panelQueries.getByText(/Autonomer Agenten-Schwarm/i)).toBeInTheDocument();
    expect(panelQueries.getByPlaceholderText(/Ziel des autonomen Schwarmauftrags/i)).toBeInTheDocument();
    expect(panelQueries.getByPlaceholderText(/Kontext, Risiken oder zusätzliche Vorgaben/i)).toBeInTheDocument();
    expect(panelQueries.getByDisplayValue("Standard")).toBeInTheDocument();
    expect(panelQueries.getByRole("button", { name: /Autonomen Schwarmauftrag starten/i })).toBeInTheDocument();
  });

  it("ermöglicht Governance-Eingriffe für laufende und freigabepflichtige autonome Läufe", async () => {
    const onControlAutonomyRun = vi.fn(async () => undefined);

    render(
      <Harness
        autonomyRuns={[createAutonomyRun("running"), createAutonomyRun("awaiting_approval")]}
        onControlAutonomyRun={onControlAutonomyRun}
      />,
    );

    expect(screen.getAllByText(/Autonomer Lauf #401/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Autonomer Lauf #402/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Delegationsplan/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ereignisverlauf/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /Freigeben/i })[0]);

    await waitFor(() => {
      expect(onControlAutonomyRun).toHaveBeenCalledWith({ runId: 402, action: "approve" });
    });
  });

  it("hält die Reporting- und Autonomie-Container min-width-sicher und breitenschonend", () => {
    const { container } = render(<Harness />);

    const rootPanel = container.firstElementChild as HTMLElement;
    expect(rootPanel.className).toContain("min-w-0");
    expect(rootPanel.className).toContain("overflow-hidden");

    const metricGrid = screen.getAllByText("Nachrichtenfenster")[0].closest("button")?.parentElement as HTMLElement;
    expect(metricGrid.className).toContain("min-w-0");
    expect(metricGrid.className).toContain("[grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]");

    const exportActionColumn = screen.getAllByPlaceholderText(/Begründung für den Report-Download/i)[0].parentElement as HTMLElement;
    expect(exportActionColumn.className).toContain("min-w-0");
    expect(exportActionColumn.className).toContain("grid");

    const autonomyPanel = screen.getAllByTestId("swarm-autonomy-panel-7")[0];
    const autonomyGrid = screen.getAllByPlaceholderText(/Ziel des autonomen Schwarmauftrags/i)[0].closest("div")?.parentElement as HTMLElement;
    expect(autonomyPanel.className).toContain("min-w-0");
    expect(autonomyGrid.className).toContain("[grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))]");
  });
});
