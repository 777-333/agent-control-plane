import { eq } from "drizzle-orm";
import {
  swarmReportDownloadApprovals,
  swarmReportExports,
  swarmReportSubscriptions,
} from "../drizzle/schema";

export type SwarmReportFormat = "csv" | "pdf";
export type SwarmReportCadence = "daily" | "weekly" | "monthly";
export type SwarmReportTriggerSource = "manual" | "approval" | "subscription";
export type SwarmSystemRole = "user" | "admin" | "system";
export type SwarmApprovalStatus = "pending" | "approved" | "rejected" | "consumed";

export type SwarmForReports = {
  id: number;
  name: string;
  mission: string;
  communicationLinks: Array<{
    id: number;
    fromAgentName: string;
    toAgentName: string;
    channel: string;
    status: "active" | "idle" | "degraded";
    lastMessageAt: number;
    history: Array<{
      id: number;
      kind: "directive" | "status" | "evidence" | "approval";
      createdAt: number;
    }>;
  }>;
  governance: {
    policyMode: "monitoring" | "approval_required" | "enforced";
    approvalRequired: boolean;
    approverRole: string;
    escalationTarget: string;
    slaMinutes: number;
    escalationAfterMinutes: number;
    reportingWindowHours: number;
  };
};

export type SwarmReportExportRecord = {
  id: number;
  swarmId: number;
  format: SwarmReportFormat;
  triggerSource: SwarmReportTriggerSource;
  triggeredByUserId: number | null;
  triggeredByLabel: string;
  requesterRole: SwarmSystemRole;
  reportWindowHours: number;
  communicationLinkCount: number;
  approvalMessageCount: number;
  overdueLinkCount: number;
  averageResponseMinutes: number;
  metadata: string | null;
  createdAt: number;
};

export type SwarmReportDownloadApprovalRecord = {
  id: number;
  swarmId: number;
  format: SwarmReportFormat;
  requestStatus: SwarmApprovalStatus;
  requiredRoleLabel: string;
  requestedByUserId: number | null;
  requestedByLabel: string;
  requestedBySystemRole: "user" | "admin";
  approvedByUserId: number | null;
  approvedByLabel: string | null;
  reason: string;
  exportWindowHours: number;
  sensitivityLabel: string;
  createdAt: number;
  resolvedAt: number | null;
  consumedAt: number | null;
};

export type SwarmReportSubscriptionRecord = {
  id: number;
  swarmId: number;
  cadence: SwarmReportCadence;
  format: SwarmReportFormat;
  recipientRoleLabel: string;
  createdByUserId: number | null;
  createdByLabel: string;
  isActive: boolean;
  startImmediately: boolean;
  nextRunAt: number;
  lastRunAt: number | null;
  createdAt: number;
  updatedAt: number;
};

const now = Date.now();
let nextReportExportId = 3;
let nextReportApprovalId = 3;
let nextReportSubscriptionId = 3;

let exportHistoryData: SwarmReportExportRecord[] = [
  {
    id: 1,
    swarmId: 1,
    format: "csv",
    triggerSource: "manual",
    triggeredByUserId: 1,
    triggeredByLabel: "Ops Console",
    requesterRole: "admin",
    reportWindowHours: 24,
    communicationLinkCount: 3,
    approvalMessageCount: 2,
    overdueLinkCount: 0,
    averageResponseMinutes: 8,
    metadata: "Erstexport für Governance-Review des Incident-Swarms.",
    createdAt: now - 1000 * 60 * 180,
  },
  {
    id: 2,
    swarmId: 1,
    format: "pdf",
    triggerSource: "subscription",
    triggeredByUserId: null,
    triggeredByLabel: "Governance Scheduler",
    requesterRole: "system",
    reportWindowHours: 24,
    communicationLinkCount: 3,
    approvalMessageCount: 2,
    overdueLinkCount: 0,
    averageResponseMinutes: 8,
    metadata: "Automatisch erzeugter Morgenbericht für Head of Operations.",
    createdAt: now - 1000 * 60 * 75,
  },
];

let downloadApprovalData: SwarmReportDownloadApprovalRecord[] = [
  {
    id: 1,
    swarmId: 1,
    format: "pdf",
    requestStatus: "approved",
    requiredRoleLabel: "finance_approver",
    requestedByUserId: 2,
    requestedByLabel: "Mara Vogt",
    requestedBySystemRole: "user",
    approvedByUserId: 1,
    approvedByLabel: "Ops Console",
    reason: "Vorbereitung des Incident-Boards mit revisionssicherem PDF-Report.",
    exportWindowHours: 24,
    sensitivityLabel: "approval_required / production",
    createdAt: now - 1000 * 60 * 95,
    resolvedAt: now - 1000 * 60 * 90,
    consumedAt: now - 1000 * 60 * 88,
  },
  {
    id: 2,
    swarmId: 1,
    format: "csv",
    requestStatus: "pending",
    requiredRoleLabel: "finance_approver",
    requestedByUserId: 3,
    requestedByLabel: "Jonas Ritter",
    requestedBySystemRole: "user",
    approvedByUserId: null,
    approvedByLabel: null,
    reason: "Analytische Nachbereitung mit Rohdaten je Kommunikationspfad.",
    exportWindowHours: 24,
    sensitivityLabel: "approval_required / production",
    createdAt: now - 1000 * 60 * 12,
    resolvedAt: null,
    consumedAt: null,
  },
];

let subscriptionData: SwarmReportSubscriptionRecord[] = [
  {
    id: 1,
    swarmId: 1,
    cadence: "daily",
    format: "pdf",
    recipientRoleLabel: "Head of Operations",
    createdByUserId: 1,
    createdByLabel: "Ops Console",
    isActive: true,
    startImmediately: true,
    nextRunAt: now + 1000 * 60 * 60 * 20,
    lastRunAt: now - 1000 * 60 * 75,
    createdAt: now - 1000 * 60 * 60 * 24,
    updatedAt: now - 1000 * 60 * 75,
  },
  {
    id: 2,
    swarmId: 1,
    cadence: "weekly",
    format: "csv",
    recipientRoleLabel: "finance_approver",
    createdByUserId: 1,
    createdByLabel: "Ops Console",
    isActive: true,
    startImmediately: false,
    nextRunAt: now + 1000 * 60 * 60 * 24 * 6,
    lastRunAt: null,
    createdAt: now - 1000 * 60 * 60 * 6,
    updatedAt: now - 1000 * 60 * 60 * 6,
  },
];

function toTimestamp(value: Date | string | number | null | undefined) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

function isTrueFlag(value: string | boolean | null | undefined) {
  return value === true || value === "true";
}

function cadenceToMs(cadence: SwarmReportCadence) {
  switch (cadence) {
    case "daily":
      return 1000 * 60 * 60 * 24;
    case "weekly":
      return 1000 * 60 * 60 * 24 * 7;
    case "monthly":
      return 1000 * 60 * 60 * 24 * 30;
  }
}

export function computeSwarmReportStats(swarm: SwarmForReports) {
  const currentTime = Date.now();
  const windowStart = currentTime - swarm.governance.reportingWindowHours * 60 * 60 * 1000;
  const allMessages = swarm.communicationLinks.flatMap(link => link.history);
  const messageWindowCount = allMessages.filter(message => message.createdAt >= windowStart).length;
  const approvalMessageCount = allMessages.filter(message => message.kind === "approval" && message.createdAt >= windowStart).length;
  const overdueLinkCount = swarm.communicationLinks.filter(link => currentTime - link.lastMessageAt > swarm.governance.slaMinutes * 60 * 1000).length;
  const escalatedLinkCount = swarm.communicationLinks.filter(link => currentTime - link.lastMessageAt > swarm.governance.escalationAfterMinutes * 60 * 1000).length;
  const averageResponseMinutes = swarm.communicationLinks.length === 0
    ? 0
    : Math.round(
      swarm.communicationLinks.reduce((sum, link) => sum + Math.max(1, (currentTime - link.lastMessageAt) / (1000 * 60)), 0) / swarm.communicationLinks.length,
    );

  return {
    messageWindowCount,
    approvalMessageCount,
    overdueLinkCount,
    escalatedLinkCount,
    averageResponseMinutes,
  };
}

function getSensitivityLabel(swarm: SwarmForReports) {
  const facets = [swarm.governance.policyMode];
  if (swarm.governance.approvalRequired) facets.push("approval_required");
  return `${facets.join(" / ")} / ${swarm.communicationLinks.length > 0 ? "operational" : "idle"}`;
}

function requiresApproval(swarm: SwarmForReports, requesterRole: "user" | "admin") {
  return requesterRole !== "admin" && (swarm.governance.approvalRequired || swarm.governance.policyMode !== "monitoring");
}

function serializeMetadata(metadata: Record<string, string | number | boolean | null | undefined>) {
  return JSON.stringify(metadata);
}

async function syncNextIds(db: any) {
  if (!db) return;
  const [existingExports, existingApprovals, existingSubscriptions] = await Promise.all([
    db.select({ id: swarmReportExports.id }).from(swarmReportExports),
    db.select({ id: swarmReportDownloadApprovals.id }).from(swarmReportDownloadApprovals),
    db.select({ id: swarmReportSubscriptions.id }).from(swarmReportSubscriptions),
  ]);

  nextReportExportId = Math.max(nextReportExportId, ...existingExports.map((item: { id: number }) => item.id + 1), 1);
  nextReportApprovalId = Math.max(nextReportApprovalId, ...existingApprovals.map((item: { id: number }) => item.id + 1), 1);
  nextReportSubscriptionId = Math.max(nextReportSubscriptionId, ...existingSubscriptions.map((item: { id: number }) => item.id + 1), 1);
}

async function loadExports(db: any) {
  if (!db) return [...exportHistoryData].sort((a, b) => b.createdAt - a.createdAt);
  const rows = await db.select().from(swarmReportExports);
  return rows.map((row: any) => ({
    id: row.id,
    swarmId: row.swarmId,
    format: row.format,
    triggerSource: row.triggerSource,
    triggeredByUserId: row.triggeredByUserId ?? null,
    triggeredByLabel: row.triggeredByLabel,
    requesterRole: row.requesterRole,
    reportWindowHours: row.reportWindowHours,
    communicationLinkCount: row.communicationLinkCount,
    approvalMessageCount: row.approvalMessageCount,
    overdueLinkCount: row.overdueLinkCount,
    averageResponseMinutes: row.averageResponseMinutes,
    metadata: row.metadata ?? null,
    createdAt: toTimestamp(row.createdAt) ?? Date.now(),
  } satisfies SwarmReportExportRecord)).sort((a: SwarmReportExportRecord, b: SwarmReportExportRecord) => b.createdAt - a.createdAt);
}

async function loadApprovals(db: any) {
  if (!db) return [...downloadApprovalData].sort((a, b) => b.createdAt - a.createdAt);
  const rows = await db.select().from(swarmReportDownloadApprovals);
  return rows.map((row: any) => ({
    id: row.id,
    swarmId: row.swarmId,
    format: row.format,
    requestStatus: row.requestStatus,
    requiredRoleLabel: row.requiredRoleLabel,
    requestedByUserId: row.requestedByUserId ?? null,
    requestedByLabel: row.requestedByLabel,
    requestedBySystemRole: row.requestedBySystemRole,
    approvedByUserId: row.approvedByUserId ?? null,
    approvedByLabel: row.approvedByLabel ?? null,
    reason: row.reason,
    exportWindowHours: row.exportWindowHours,
    sensitivityLabel: row.sensitivityLabel,
    createdAt: toTimestamp(row.createdAt) ?? Date.now(),
    resolvedAt: toTimestamp(row.resolvedAt),
    consumedAt: toTimestamp(row.consumedAt),
  } satisfies SwarmReportDownloadApprovalRecord)).sort((a: SwarmReportDownloadApprovalRecord, b: SwarmReportDownloadApprovalRecord) => b.createdAt - a.createdAt);
}

async function loadSubscriptions(db: any) {
  if (!db) return [...subscriptionData].sort((a, b) => b.createdAt - a.createdAt);
  const rows = await db.select().from(swarmReportSubscriptions);
  return rows.map((row: any) => ({
    id: row.id,
    swarmId: row.swarmId,
    cadence: row.cadence,
    format: row.format,
    recipientRoleLabel: row.recipientRoleLabel,
    createdByUserId: row.createdByUserId ?? null,
    createdByLabel: row.createdByLabel,
    isActive: isTrueFlag(row.isActive),
    startImmediately: isTrueFlag(row.startImmediately),
    nextRunAt: toTimestamp(row.nextRunAt) ?? Date.now(),
    lastRunAt: toTimestamp(row.lastRunAt),
    createdAt: toTimestamp(row.createdAt) ?? Date.now(),
    updatedAt: toTimestamp(row.updatedAt) ?? Date.now(),
  } satisfies SwarmReportSubscriptionRecord)).sort((a: SwarmReportSubscriptionRecord, b: SwarmReportSubscriptionRecord) => b.createdAt - a.createdAt);
}

async function insertExport(db: any, entry: SwarmReportExportRecord) {
  if (!db) {
    exportHistoryData = [entry, ...exportHistoryData].sort((a, b) => b.createdAt - a.createdAt);
    return entry;
  }

  await db.insert(swarmReportExports).values({
    id: entry.id,
    swarmId: entry.swarmId,
    format: entry.format,
    triggerSource: entry.triggerSource,
    triggeredByUserId: entry.triggeredByUserId,
    triggeredByLabel: entry.triggeredByLabel,
    requesterRole: entry.requesterRole,
    reportWindowHours: entry.reportWindowHours,
    communicationLinkCount: entry.communicationLinkCount,
    approvalMessageCount: entry.approvalMessageCount,
    overdueLinkCount: entry.overdueLinkCount,
    averageResponseMinutes: entry.averageResponseMinutes,
    metadata: entry.metadata,
    createdAt: new Date(entry.createdAt),
  });
  return entry;
}

async function insertApproval(db: any, entry: SwarmReportDownloadApprovalRecord) {
  if (!db) {
    downloadApprovalData = [entry, ...downloadApprovalData].sort((a, b) => b.createdAt - a.createdAt);
    return entry;
  }

  await db.insert(swarmReportDownloadApprovals).values({
    id: entry.id,
    swarmId: entry.swarmId,
    format: entry.format,
    requestStatus: entry.requestStatus,
    requiredRoleLabel: entry.requiredRoleLabel,
    requestedByUserId: entry.requestedByUserId,
    requestedByLabel: entry.requestedByLabel,
    requestedBySystemRole: entry.requestedBySystemRole,
    approvedByUserId: entry.approvedByUserId,
    approvedByLabel: entry.approvedByLabel,
    reason: entry.reason,
    exportWindowHours: entry.exportWindowHours,
    sensitivityLabel: entry.sensitivityLabel,
    createdAt: new Date(entry.createdAt),
    resolvedAt: entry.resolvedAt ? new Date(entry.resolvedAt) : null,
    consumedAt: entry.consumedAt ? new Date(entry.consumedAt) : null,
  });
  return entry;
}

async function updateApproval(db: any, entry: SwarmReportDownloadApprovalRecord) {
  if (!db) {
    downloadApprovalData = downloadApprovalData.map(item => item.id === entry.id ? entry : item);
    return entry;
  }

  await db.update(swarmReportDownloadApprovals).set({
    requestStatus: entry.requestStatus,
    approvedByUserId: entry.approvedByUserId,
    approvedByLabel: entry.approvedByLabel,
    resolvedAt: entry.resolvedAt ? new Date(entry.resolvedAt) : null,
    consumedAt: entry.consumedAt ? new Date(entry.consumedAt) : null,
  }).where(eq(swarmReportDownloadApprovals.id, entry.id));
  return entry;
}

async function insertSubscription(db: any, entry: SwarmReportSubscriptionRecord) {
  if (!db) {
    subscriptionData = [entry, ...subscriptionData].sort((a, b) => b.createdAt - a.createdAt);
    return entry;
  }

  await db.insert(swarmReportSubscriptions).values({
    id: entry.id,
    swarmId: entry.swarmId,
    cadence: entry.cadence,
    format: entry.format,
    recipientRoleLabel: entry.recipientRoleLabel,
    createdByUserId: entry.createdByUserId,
    createdByLabel: entry.createdByLabel,
    isActive: entry.isActive ? "true" : "false",
    startImmediately: entry.startImmediately ? "true" : "false",
    nextRunAt: new Date(entry.nextRunAt),
    lastRunAt: entry.lastRunAt ? new Date(entry.lastRunAt) : null,
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.updatedAt),
  });
  return entry;
}

async function updateSubscription(db: any, entry: SwarmReportSubscriptionRecord) {
  if (!db) {
    subscriptionData = subscriptionData.map(item => item.id === entry.id ? entry : item);
    return entry;
  }

  await db.update(swarmReportSubscriptions).set({
    isActive: entry.isActive ? "true" : "false",
    startImmediately: entry.startImmediately ? "true" : "false",
    nextRunAt: new Date(entry.nextRunAt),
    lastRunAt: entry.lastRunAt ? new Date(entry.lastRunAt) : null,
    updatedAt: new Date(entry.updatedAt),
  }).where(eq(swarmReportSubscriptions.id, entry.id));
  return entry;
}

function buildExportEntry(input: {
  swarm: SwarmForReports;
  format: SwarmReportFormat;
  triggerSource: SwarmReportTriggerSource;
  triggeredByUserId: number | null;
  triggeredByLabel: string;
  requesterRole: SwarmSystemRole;
  metadata: string;
}) {
  const stats = computeSwarmReportStats(input.swarm);
  return {
    id: nextReportExportId++,
    swarmId: input.swarm.id,
    format: input.format,
    triggerSource: input.triggerSource,
    triggeredByUserId: input.triggeredByUserId,
    triggeredByLabel: input.triggeredByLabel,
    requesterRole: input.requesterRole,
    reportWindowHours: input.swarm.governance.reportingWindowHours,
    communicationLinkCount: input.swarm.communicationLinks.length,
    approvalMessageCount: stats.approvalMessageCount,
    overdueLinkCount: stats.overdueLinkCount,
    averageResponseMinutes: stats.averageResponseMinutes,
    metadata: input.metadata,
    createdAt: Date.now(),
  } satisfies SwarmReportExportRecord;
}

export async function processDueSwarmReportSubscriptions(db: any, swarms: SwarmForReports[]) {
  await syncNextIds(db);
  const subscriptions = await loadSubscriptions(db);
  for (const subscription of subscriptions) {
    if (!subscription.isActive || subscription.nextRunAt > Date.now()) continue;
    const swarm = swarms.find(item => item.id === subscription.swarmId);
    if (!swarm) continue;

    const exportEntry = buildExportEntry({
      swarm,
      format: subscription.format,
      triggerSource: "subscription",
      triggeredByUserId: null,
      triggeredByLabel: "Governance Scheduler",
      requesterRole: "system",
      metadata: serializeMetadata({
        cadence: subscription.cadence,
        recipientRoleLabel: subscription.recipientRoleLabel,
        subscriptionId: subscription.id,
      }),
    });
    await insertExport(db, exportEntry);

    subscription.lastRunAt = Date.now();
    subscription.nextRunAt = Date.now() + cadenceToMs(subscription.cadence);
    subscription.updatedAt = Date.now();
    await updateSubscription(db, subscription);
  }
}

export async function listSwarmReportState(db: any, swarms: SwarmForReports[]) {
  await processDueSwarmReportSubscriptions(db, swarms);
  const [exports, approvals, subscriptions] = await Promise.all([
    loadExports(db),
    loadApprovals(db),
    loadSubscriptions(db),
  ]);
  return { exports, approvals, subscriptions };
}

export async function requestSwarmReportDownload(input: {
  db: any;
  swarms: SwarmForReports[];
  swarmId: number;
  format: SwarmReportFormat;
  reason: string;
  requestedByUserId: number | null;
  requestedByLabel: string;
  requestedBySystemRole: "user" | "admin";
}) {
  await syncNextIds(input.db);
  const swarm = input.swarms.find((item: SwarmForReports) => item.id === input.swarmId);
  if (!swarm) throw new Error(`Schwarm ${input.swarmId} wurde nicht gefunden.`);

  const approvals = await loadApprovals(input.db);
  const reusableApproval = approvals.find((item: SwarmReportDownloadApprovalRecord) =>
    item.swarmId === input.swarmId &&
    item.format === input.format &&
    item.requestedByLabel === input.requestedByLabel &&
    item.requestStatus === "approved" &&
    item.consumedAt == null,
  );

  if (reusableApproval) {
    reusableApproval.requestStatus = "consumed";
    reusableApproval.consumedAt = Date.now();
    await updateApproval(input.db, reusableApproval);
    const exportEntry = buildExportEntry({
      swarm,
      format: input.format,
      triggerSource: "approval",
      triggeredByUserId: input.requestedByUserId,
      triggeredByLabel: input.requestedByLabel,
      requesterRole: input.requestedBySystemRole,
      metadata: serializeMetadata({
        approvalId: reusableApproval.id,
        reason: reusableApproval.reason,
        sensitivityLabel: reusableApproval.sensitivityLabel,
      }),
    });
    await insertExport(input.db, exportEntry);
    return { status: "approved" as const, approval: reusableApproval, exportEntry };
  }

  if (requiresApproval(swarm, input.requestedBySystemRole)) {
    const approvalEntry: SwarmReportDownloadApprovalRecord = {
      id: nextReportApprovalId++,
      swarmId: swarm.id,
      format: input.format,
      requestStatus: "pending",
      requiredRoleLabel: swarm.governance.approverRole,
      requestedByUserId: input.requestedByUserId,
      requestedByLabel: input.requestedByLabel,
      requestedBySystemRole: input.requestedBySystemRole,
      approvedByUserId: null,
      approvedByLabel: null,
      reason: input.reason,
      exportWindowHours: swarm.governance.reportingWindowHours,
      sensitivityLabel: getSensitivityLabel(swarm),
      createdAt: Date.now(),
      resolvedAt: null,
      consumedAt: null,
    };
    await insertApproval(input.db, approvalEntry);
    return { status: "pending" as const, approval: approvalEntry, exportEntry: null };
  }

  const exportEntry = buildExportEntry({
    swarm,
    format: input.format,
    triggerSource: "manual",
    triggeredByUserId: input.requestedByUserId,
    triggeredByLabel: input.requestedByLabel,
    requesterRole: input.requestedBySystemRole,
    metadata: serializeMetadata({ reason: input.reason, sensitivityLabel: getSensitivityLabel(swarm) }),
  });
  await insertExport(input.db, exportEntry);
  return { status: "approved" as const, approval: null, exportEntry };
}

export async function resolveSwarmReportDownloadApproval(input: {
  db: any;
  approvalId: number;
  decision: "approved" | "rejected";
  resolvedByUserId: number | null;
  resolvedByLabel: string;
  resolvedBySystemRole: "user" | "admin";
}) {
  if (input.resolvedBySystemRole !== "admin") {
    throw new Error("Nur Admin-Rollen dürfen sensible Report-Downloads freigeben oder ablehnen.");
  }

  const approvals = await loadApprovals(input.db);
  const approval = approvals.find((item: SwarmReportDownloadApprovalRecord) => item.id === input.approvalId);
  if (!approval) throw new Error("Download-Freigabe wurde nicht gefunden.");
  if (approval.requestStatus !== "pending") throw new Error("Diese Download-Freigabe ist nicht mehr offen.");

  approval.requestStatus = input.decision;
  approval.approvedByUserId = input.resolvedByUserId;
  approval.approvedByLabel = input.resolvedByLabel;
  approval.resolvedAt = Date.now();
  await updateApproval(input.db, approval);
  return approval;
}

export async function createSwarmReportSubscription(input: {
  db: any;
  swarms: SwarmForReports[];
  swarmId: number;
  cadence: SwarmReportCadence;
  format: SwarmReportFormat;
  recipientRoleLabel: string;
  createdByUserId: number | null;
  createdByLabel: string;
  startImmediately: boolean;
}) {
  await syncNextIds(input.db);
  const swarm = input.swarms.find((item: SwarmForReports) => item.id === input.swarmId);
  if (!swarm) throw new Error(`Schwarm ${input.swarmId} wurde nicht gefunden.`);

  const entry: SwarmReportSubscriptionRecord = {
    id: nextReportSubscriptionId++,
    swarmId: input.swarmId,
    cadence: input.cadence,
    format: input.format,
    recipientRoleLabel: input.recipientRoleLabel,
    createdByUserId: input.createdByUserId,
    createdByLabel: input.createdByLabel,
    isActive: true,
    startImmediately: input.startImmediately,
    nextRunAt: input.startImmediately ? Date.now() - 1000 : Date.now() + cadenceToMs(input.cadence),
    lastRunAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await insertSubscription(input.db, entry);
  await processDueSwarmReportSubscriptions(input.db, input.swarms);
  return entry;
}
