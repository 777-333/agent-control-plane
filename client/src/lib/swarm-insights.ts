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

export type SwarmCommunicationLinkWithNames = SwarmCommunicationLinkForInsights & {
  fromAgentName?: string;
  toAgentName?: string;
};

export type SwarmReportingMetricKey = "messages" | "approvals" | "sla" | "response";

export type SwarmReportingDrilldownItem = {
  linkId: number;
  title: string;
  description: string;
  valueLabel: string;
  severity: "neutral" | "success" | "warning" | "danger";
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

export function getSwarmReportingDrilldownItems(
  swarm: {
    communicationLinks: SwarmCommunicationLinkWithNames[];
    governance: SwarmGovernanceForInsights;
  },
  metric: SwarmReportingMetricKey,
  now = Date.now(),
): SwarmReportingDrilldownItem[] {
  const reportingWindowStart = now - swarm.governance.reportingWindowHours * 60 * 60 * 1000;

  if (metric === "messages") {
    return swarm.communicationLinks
      .map(link => {
        const count = link.history.filter(message => message.createdAt >= reportingWindowStart).length;
        return {
          linkId: link.id,
          title: `${link.fromAgentName ?? "Quelle"} → ${link.toAgentName ?? "Ziel"}`,
          description: `${count} Nachrichten im Reporting-Fenster`,
          valueLabel: `${count}`,
          severity: count > 0 ? "success" : "neutral",
        } satisfies SwarmReportingDrilldownItem;
      })
      .filter(item => Number(item.valueLabel) > 0)
      .sort((left, right) => Number(right.valueLabel) - Number(left.valueLabel));
  }

  if (metric === "approvals") {
    return swarm.communicationLinks
      .map(link => {
        const count = link.history.filter(message => message.createdAt >= reportingWindowStart && message.kind === "approval").length;
        return {
          linkId: link.id,
          title: `${link.fromAgentName ?? "Quelle"} → ${link.toAgentName ?? "Ziel"}`,
          description: `${count} Approval-Ereignisse im Zeitfenster`,
          valueLabel: `${count}`,
          severity: count > 0 ? "success" : "neutral",
        } satisfies SwarmReportingDrilldownItem;
      })
      .filter(item => Number(item.valueLabel) > 0)
      .sort((left, right) => Number(right.valueLabel) - Number(left.valueLabel));
  }

  if (metric === "sla") {
    return swarm.communicationLinks
      .filter(link => now - link.lastMessageAt > swarm.governance.slaMinutes * 60 * 1000)
      .map(link => {
        const minutes = Math.max(1, Math.round((now - link.lastMessageAt) / 60000));
        return {
          linkId: link.id,
          title: `${link.fromAgentName ?? "Quelle"} → ${link.toAgentName ?? "Ziel"}`,
          description: `Pfad liegt ${minutes - swarm.governance.slaMinutes} Min. über der SLA-Grenze`,
          valueLabel: `${minutes} Min.`,
          severity: now - link.lastMessageAt > swarm.governance.escalationAfterMinutes * 60 * 1000 ? "danger" : "warning",
        } satisfies SwarmReportingDrilldownItem;
      })
      .sort((left, right) => Number.parseInt(right.valueLabel, 10) - Number.parseInt(left.valueLabel, 10));
  }

  return swarm.communicationLinks
    .map(link => {
      const minutes = Math.max(1, Math.round((now - link.lastMessageAt) / 60000));
      const escalated = now - link.lastMessageAt > swarm.governance.escalationAfterMinutes * 60 * 1000;
      return {
        linkId: link.id,
        title: `${link.fromAgentName ?? "Quelle"} → ${link.toAgentName ?? "Ziel"}`,
        description: escalated ? "Über Eskalationsgrenze" : "Innerhalb des Eskalationsfensters",
        valueLabel: `${minutes} Min.`,
        severity: escalated ? "danger" : minutes > swarm.governance.slaMinutes ? "warning" : "neutral",
      } satisfies SwarmReportingDrilldownItem;
    })
    .sort((left, right) => Number.parseInt(right.valueLabel, 10) - Number.parseInt(left.valueLabel, 10));
}
