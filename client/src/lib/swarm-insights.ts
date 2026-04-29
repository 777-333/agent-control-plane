export type SwarmHistoryFilterKind = "all" | "directive" | "status" | "evidence" | "approval";

export type SwarmHistoryFilter = {
  query: string;
  kind: SwarmHistoryFilterKind;
};

export type SwarmHistoryMessage = {
  id: number;
  senderAgentName: string;
  content: string;
  kind: Exclude<SwarmHistoryFilterKind, "all">;
  createdAt: number;
};

export type SwarmCommunicationLinkForInsights = {
  id: number;
  status: string;
  lastMessageAt: number;
  history: SwarmHistoryMessage[];
};

export type SwarmGovernanceForInsights = {
  reportingWindowHours: number;
  slaMinutes: number;
  escalationAfterMinutes: number;
};

export type SwarmForInsights = {
  communicationLinks: SwarmCommunicationLinkForInsights[];
  governance: SwarmGovernanceForInsights;
};

export function filterSwarmHistory(history: SwarmHistoryMessage[], filter: SwarmHistoryFilter) {
  const normalizedQuery = filter.query.trim().toLowerCase();

  return history.filter(message => {
    const matchesKind = filter.kind === "all" || message.kind === filter.kind;
    const matchesQuery = normalizedQuery.length === 0
      || `${message.senderAgentName} ${message.content}`.toLowerCase().includes(normalizedQuery);
    return matchesKind && matchesQuery;
  });
}

export function getSwarmReportingStats(swarm: SwarmForInsights, now = Date.now()) {
  const reportingWindowStart = now - swarm.governance.reportingWindowHours * 60 * 60 * 1000;
  const reportMessages = swarm.communicationLinks.flatMap(link =>
    link.history
      .filter(message => message.createdAt >= reportingWindowStart)
      .map(message => ({ ...message, linkId: link.id, status: link.status })),
  );
  const approvalMessages = reportMessages.filter(message => message.kind === "approval").length;
  const overdueLinks = swarm.communicationLinks.filter(link => now - link.lastMessageAt > swarm.governance.slaMinutes * 60 * 1000).length;
  const escalatedLinks = swarm.communicationLinks.filter(link => now - link.lastMessageAt > swarm.governance.escalationAfterMinutes * 60 * 1000).length;
  const averageResponseMinutes = swarm.communicationLinks.length > 0
    ? Math.round(
      swarm.communicationLinks.reduce((sum, link) => sum + Math.max(1, Math.round((now - link.lastMessageAt) / 60000)), 0)
      / swarm.communicationLinks.length,
    )
    : 0;

  return {
    reportingWindowStart,
    reportMessages,
    messageWindowCount: reportMessages.length,
    approvalMessages,
    overdueLinks,
    escalatedLinks,
    averageResponseMinutes,
  };
}
