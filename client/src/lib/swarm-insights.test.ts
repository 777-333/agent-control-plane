import { describe, expect, it } from "vitest";
import { filterSwarmHistory, getSwarmReportingStats, type SwarmForInsights, type SwarmHistoryMessage } from "./swarm-insights";

const NOW = Date.UTC(2026, 3, 29, 10, 0, 0);

function createMessage(overrides: Partial<SwarmHistoryMessage> = {}): SwarmHistoryMessage {
  return {
    id: overrides.id ?? 1,
    senderAgentName: overrides.senderAgentName ?? "Finance Sentinel",
    content: overrides.content ?? "Genehmigungslage wurde aktualisiert.",
    kind: overrides.kind ?? "status",
    createdAt: overrides.createdAt ?? NOW - 5 * 60 * 1000,
  };
}

function createSwarm(): SwarmForInsights {
  return {
    governance: {
      reportingWindowHours: 4,
      slaMinutes: 30,
      escalationAfterMinutes: 90,
    },
    communicationLinks: [
      {
        id: 11,
        status: "healthy",
        lastMessageAt: NOW - 20 * 60 * 1000,
        history: [
          createMessage({ id: 1, senderAgentName: "Finance Sentinel", content: "Budgetreview abgeschlossen.", kind: "status", createdAt: NOW - 10 * 60 * 1000 }),
          createMessage({ id: 2, senderAgentName: "Support Orchestrator", content: "Approval durch CFO erforderlich.", kind: "approval", createdAt: NOW - 40 * 60 * 1000 }),
        ],
      },
      {
        id: 12,
        status: "blocked",
        lastMessageAt: NOW - 110 * 60 * 1000,
        history: [
          createMessage({ id: 3, senderAgentName: "Risk Analyst", content: "Evidence für Eskalation abgelegt.", kind: "evidence", createdAt: NOW - 2 * 60 * 60 * 1000 }),
          createMessage({ id: 4, senderAgentName: "Risk Analyst", content: "Alte Direktive außerhalb des Reporting-Fensters.", kind: "directive", createdAt: NOW - 6 * 60 * 60 * 1000 }),
        ],
      },
    ],
  };
}

describe("swarm insights helpers", () => {
  it("filters a communication path history by search query and message kind", () => {
    const history = [
      createMessage({ id: 1, senderAgentName: "Finance Sentinel", content: "Budgetreview abgeschlossen.", kind: "status" }),
      createMessage({ id: 2, senderAgentName: "Support Orchestrator", content: "Approval durch CFO erforderlich.", kind: "approval" }),
      createMessage({ id: 3, senderAgentName: "Risk Analyst", content: "Evidence für Eskalation abgelegt.", kind: "evidence" }),
    ];

    const queryFiltered = filterSwarmHistory(history, { query: "cfo", kind: "all" });
    const kindFiltered = filterSwarmHistory(history, { query: "", kind: "approval" });
    const combinedFiltered = filterSwarmHistory(history, { query: "risk analyst", kind: "evidence" });

    expect(queryFiltered.map(message => message.id)).toEqual([2]);
    expect(kindFiltered.map(message => message.id)).toEqual([2]);
    expect(combinedFiltered.map(message => message.id)).toEqual([3]);
  });

  it("calculates reporting counts, SLA breaches and escalations for a swarm", () => {
    const swarm = createSwarm();

    const stats = getSwarmReportingStats(swarm, NOW);

    expect(stats.messageWindowCount).toBe(3);
    expect(stats.approvalMessages).toBe(1);
    expect(stats.overdueLinks).toBe(1);
    expect(stats.escalatedLinks).toBe(1);
    expect(stats.averageResponseMinutes).toBe(65);
    expect(stats.reportMessages.map(message => message.id)).toEqual([1, 2, 3]);
  });
});
