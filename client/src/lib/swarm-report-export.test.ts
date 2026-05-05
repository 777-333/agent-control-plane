import { describe, expect, it } from "vitest";
import { buildSwarmReportCsv, buildSwarmReportHtml } from "./swarm-report-export";

function createSwarm(now: number) {
  return {
    id: 9,
    name: "Finance Control Swarm",
    objective: "Koordiniert Freigaben und Eskalationen für sensible Budgetentscheidungen.",
    governance: {
      reportingWindowHours: 24,
      slaMinutes: 30,
      escalationAfterMinutes: 60,
    },
    communicationLinks: [
      {
        id: 101,
        fromAgentName: "Finance Sentinel",
        toAgentName: "Support Orchestrator",
        status: "healthy" as const,
        lastMessageAt: now - 15 * 60_000,
        history: [
          { id: 1, senderAgentName: "Finance Sentinel", content: "Budgetreview bestätigt.", kind: "status" as const, createdAt: now - 10 * 60_000 },
          { id: 2, senderAgentName: "Support Orchestrator", content: "Approval durch CFO eingeholt.", kind: "approval" as const, createdAt: now - 8 * 60_000 },
        ],
      },
      {
        id: 102,
        fromAgentName: "Risk Analyst",
        toAgentName: "Finance Sentinel",
        status: "warning" as const,
        lastMessageAt: now - 90 * 60_000,
        history: [
          { id: 3, senderAgentName: "Risk Analyst", content: "Eskalationshinweis archiviert.", kind: "evidence" as const, createdAt: now - 70 * 60_000 },
        ],
      },
    ],
  };
}

describe("swarm-report-export", () => {
  it("erstellt einen CSV-Report mit Kennzahlen und Drilldown-Zeilen", () => {
    const now = Date.now();
    const csv = buildSwarmReportCsv(createSwarm(now), now);

    expect(csv).toContain("Finance Control Swarm");
    expect(csv).toContain("Approval-Ereignisse;1");
    expect(csv).toContain("SLA verletzt;1");
    expect(csv).toContain("messages;Finance Sentinel → Support Orchestrator;2");
    expect(csv).toContain("sla;Risk Analyst → Finance Sentinel;90 Min.");
  });

  it("erstellt eine druckfreundliche HTML-Ansicht mit Zusammenfassung und Drilldown-Sektionen", () => {
    const now = Date.now();
    const html = buildSwarmReportHtml(createSwarm(now), now);

    expect(html).toContain("<h1>Schwarm-Report: Finance Control Swarm</h1>");
    expect(html).toContain("<strong>Nachrichtenfenster</strong><br/>3");
    expect(html).toContain("<h2>Approval-Ereignisse</h2>");
    expect(html).toContain("Finance Sentinel → Support Orchestrator");
    expect(html).toContain("<h2>SLA verletzt</h2>");
    expect(html).toContain("Pfad liegt 60 Min. über der SLA-Grenze");
  });
});
