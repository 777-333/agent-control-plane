import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, approvalChains, approvalStages, swarmMessages, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import {
  applySwarmAutonomyAction as applySwarmAutonomyActionEntry,
  createSwarmAutonomyRun as createSwarmAutonomyRunEntry,
  listSwarmAutonomyRuns,
  type SwarmAutonomyAction,
  type SwarmAutonomyPriority,
} from "./swarmAutonomy";
import {
  createSwarmReportSubscription as createSwarmReportSubscriptionEntry,
  listSwarmReportState,
  processDueSwarmReportSubscriptions,
  requestSwarmReportDownload as requestSwarmReportDownloadEntry,
  resolveSwarmReportDownloadApproval as resolveSwarmReportDownloadApprovalEntry,
} from "./swarmReports";
import {
  combinePrivacySanitizationResults,
  createCustomPrivacyRule,
  deleteCustomPrivacyRule,
  getPrivacyProtectionSummary,
  listCustomPrivacyRules,
  sanitizeTextForPrivacy,
  summarizePrivacySanitization,
  type PrivacyRuleInput,
} from "./privacy";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

type AgentStatus = "healthy" | "warning" | "paused" | "offline";
type RiskLevel = "low" | "medium" | "high" | "critical";
type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";
type ApprovalStageStatus = "waiting" | "pending" | "approved" | "rejected" | "escalated";
type EscalationStatus = "none" | "pending" | "escalated" | "resolved";
type PolicyEffect = "allowed" | "forbidden" | "approval_required";
type BranchSignalKey = "riskLevel" | "requestedBy" | "agentName" | "title" | "summary" | "chainName" | "escalationStatus";

type AgentRecord = {
  id: number;
  name: string;
  description: string;
  status: AgentStatus;
  riskLevel: RiskLevel;
  team: string;
  owner: string;
  model: string;
  environment: string;
  policyMode: string;
  lastHeartbeat: number;
  monthlyCostUsd: number;
  tokenUsage: number;
  successRate: number;
  tools: string[];
  swarmId?: number | null;
  swarmName?: string | null;
  swarmRole?: string | null;
  communicationMode?: string | null;
};

type AgentSwarmTopology = "mesh" | "hub_spoke" | "pipeline";
type AgentSwarmCoordinationMode = "consensus" | "planner_executor" | "supervisor";

type AgentSwarmMessageRecord = {
  id: number;
  senderAgentId: number;
  senderAgentName: string;
  content: string;
  kind: "directive" | "status" | "evidence" | "approval";
  createdAt: number;
};

type AgentSwarmCommunicationRecord = {
  id: number;
  fromAgentId: number;
  fromAgentName: string;
  toAgentId: number;
  toAgentName: string;
  channel: string;
  protocol: string;
  purpose: string;
  lastMessageAt: number;
  status: "active" | "idle" | "degraded";
  history: AgentSwarmMessageRecord[];
};

type AgentSwarmGovernanceRecord = {
  policyMode: "monitoring" | "approval_required" | "enforced";
  approvalRequired: boolean;
  approverRole: string;
  escalationTarget: string;
  slaMinutes: number;
  escalationAfterMinutes: number;
  reportingWindowHours: number;
};

type AgentSwarmRecord = {
  id: number;
  name: string;
  mission: string;
  topology: AgentSwarmTopology;
  coordinationMode: AgentSwarmCoordinationMode;
  team: string;
  owner: string;
  environment: string;
  createdAt: number;
  memberAgentIds: number[];
  communicationLinks: AgentSwarmCommunicationRecord[];
  governance: AgentSwarmGovernanceRecord;
};

type PolicyRecord = {
  id: number;
  name: string;
  scopeType: string;
  scopeRef: string;
  actionPattern: string;
  effect: PolicyEffect;
  priority: number;
  isActive: boolean;
  description: string;
};

type ParallelQuorumMode = "all" | "majority" | "minimum_count" | "distinct_roles";

type ApprovalStageRecord = {
  id: number;
  order: number;
  name: string;
  requiredRole: string;
  ownerLabel: string;
  status: ApprovalStageStatus;
  stageMode?: "serial" | "parallel" | "branch";
  laneKey?: string;
  branchSourceStageOrder?: number | null;
  branchLabel?: string;
  branchField?: BranchSignalKey;
  branchOperator?: "always" | "equals" | "contains" | "greater_than" | "less_than";
  branchValue?: string;
  quorumMode?: ParallelQuorumMode;
  quorumTarget?: number;
  startedAt?: number;
  resolvedAt?: number;
  slaMinutes: number;
  escalationAfterMinutes: number;
  escalationTarget: string;
  escalationTriggeredAt?: number;
  note?: string;
};

type ApprovalChainStageTemplateRecord = {
  id: number;
  stageOrder: number;
  stageName: string;
  requiredRole: string;
  defaultApproverLabel: string;
  stageMode?: "serial" | "parallel" | "branch";
  laneKey?: string;
  branchSourceStageOrder?: number | null;
  branchLabel?: string;
  branchField?: BranchSignalKey;
  branchOperator?: "always" | "equals" | "contains" | "greater_than" | "less_than";
  branchValue?: string;
  quorumMode?: ParallelQuorumMode;
  quorumTarget?: number;
  slaMinutes: number;
  escalationAfterMinutes: number;
  escalationTargetLabel: string;
};

type ApprovalChainCalendarProfileRecord = {
  presetId: string;
  businessDayStartHour: number;
  businessDayEndHour: number;
  workingDays: number[];
  holidayDates: string[];
};

type ApprovalChainTemplateRecord = {
  id: number;
  name: string;
  description: string;
  escalationMode: "serial" | "parallel" | "auto_escalate";
  calendarProfile: ApprovalChainCalendarProfileRecord;
  createdAt: number;
  updatedAt: number;
  stages: ApprovalChainStageTemplateRecord[];
};

type ApprovalRecord = {
  id: number;
  agentId: number;
  actionId: number;
  agentName: string;
  title: string;
  summary: string;
  status: ApprovalStatus;
  riskLevel: RiskLevel;
  requestedAt: number;
  requestedBy: string;
  approver?: string;
  chainId: number;
  chainName: string;
  escalationStatus: EscalationStatus;
  currentStageOrder: number;
  stages: ApprovalStageRecord[];
};

type ApprovalNotificationRecord = {
  id: number;
  approvalId: number;
  approvalTitle: string;
  severity: RiskLevel | string;
  recipientRole: string;
  ownerLabel: string;
  escalationTarget?: string;
  actionType: "review" | "escalation" | "handover" | "resolution";
  channel: "inbox" | "owner_notification";
  createdAt: number;
};

type AuditEventRecord = {
  id: number;
  agentId: number;
  agentName: string;
  severity: "info" | "warning" | "critical";
  category: string;
  title: string;
  detail: string;
  actorType: "agent" | "user" | "system";
  actorRef: string;
  createdAt: number;
};

type ConnectorRecord = {
  id: number;
  name: string;
  type: string;
  status: "connected" | "degraded" | "disconnected";
  endpointLabel: string;
  authMode: string;
  linkedAgents: number;
  lastSyncAt: number;
};

type EvaluationRecord = {
  id: number;
  agentId: number;
  agentName: string;
  name: string;
  status: "draft" | "running" | "passed" | "failed";
  score: number;
  policyPassRate: number;
  summary: string;
  executedAt: number;
};

type GuardrailRecord = {
  id: number;
  agentId: number;
  agentName: string;
  triggerType: string;
  status: "monitoring" | "stopped" | "resolved";
  thresholdLabel: string;
  detail: string;
  createdAt: number;
};

type MetricRecord = {
  id: number;
  agentId: number;
  agentName: string;
  latencyMs: number;
  errorRate: number;
  apiCostUsd: number;
  tokenUsage: number;
  windowLabel: string;
  capturedAt: number;
};

type TeamRecord = {
  id: number;
  name: string;
  members: number;
  owner: string;
  coverage: string;
};

type PermissionRecord = {
  id: number;
  subject: string;
  subjectType: "user" | "team";
  agentName: string;
  permissionLevel: "viewer" | "operator" | "approver" | "admin";
  toolScope: string;
};

const now = Date.now();
let nextAgentId = 4;
let nextSwarmId = 2;
let nextSwarmCommunicationId = 100;
let nextSwarmMessageId = 1000;
let nextPolicyId = 4;
let nextTeamId = 4;
let nextPermissionId = 5;
let nextEvaluationId = 4;
let nextGuardrailId = 4;
let nextApprovalChainId = 3;
let nextApprovalStageTemplateId = 1000;
let approvalChainSeedChecked = false;

const agentsData: AgentRecord[] = [
  {
    id: 1,
    name: "Finance Sentinel",
    description: "Überwacht Rechnungsprüfung, Zahlungsfreigaben und ERP-Aktionen mit hohen Governance-Anforderungen.",
    status: "healthy",
    riskLevel: "critical",
    team: "Finance Operations",
    owner: "Sophie Keller",
    model: "gpt-4.1",
    environment: "production",
    policyMode: "enforced",
    lastHeartbeat: now - 1000 * 60 * 2,
    monthlyCostUsd: 4820,
    tokenUsage: 1840000,
    successRate: 98.8,
    tools: ["ERP", "Browser", "Data API"],
    swarmId: 1,
    swarmName: "Incident Resolution Swarm",
    swarmRole: "supervisor",
    communicationMode: "supervisor",
  },
  {
    id: 2,
    name: "Support Orchestrator",
    description: "Koordiniert CRM-, E-Mail- und Browser-Schritte für eskalierte Supportfälle.",
    status: "warning",
    riskLevel: "high",
    team: "Customer Success",
    owner: "Mara Vogt",
    model: "gpt-4.1-mini",
    environment: "staging",
    policyMode: "approval-aware",
    lastHeartbeat: now - 1000 * 60 * 7,
    monthlyCostUsd: 3150,
    tokenUsage: 1290000,
    successRate: 94.1,
    tools: ["CRM", "E-Mail", "Browser"],
    swarmId: 1,
    swarmName: "Incident Resolution Swarm",
    swarmRole: "coordinator",
    communicationMode: "supervisor",
  },
  {
    id: 3,
    name: "Research Navigator",
    description: "Verdichtet externe Signale und bereitet Briefings mit Quellenverweisen für Analysten vor.",
    status: "healthy",
    riskLevel: "medium",
    team: "Strategy",
    owner: "Jonas Ritter",
    model: "gpt-4.1",
    environment: "development",
    policyMode: "monitoring",
    lastHeartbeat: now - 1000 * 60 * 1,
    monthlyCostUsd: 1240,
    tokenUsage: 610000,
    successRate: 99.2,
    tools: ["Browser", "Knowledge Base", "Slides"],
    swarmId: 1,
    swarmName: "Incident Resolution Swarm",
    swarmRole: "analyst",
    communicationMode: "supervisor",
  },
];

const agentSwarmsData: AgentSwarmRecord[] = [
  {
    id: 1,
    name: "Incident Resolution Swarm",
    mission: "Koordiniert Analyse, Kundenkommunikation und Freigabevorbereitung für kritische Vorfälle über mehrere Agentenrollen hinweg.",
    topology: "hub_spoke",
    coordinationMode: "supervisor",
    team: "Cross-Functional Operations",
    owner: "Ops Console",
    environment: "production",
    createdAt: now - 1000 * 60 * 90,
    memberAgentIds: [1, 2, 3],
    governance: {
      policyMode: "approval_required",
      approvalRequired: true,
      approverRole: "finance_approver",
      escalationTarget: "Head of Operations",
      slaMinutes: 20,
      escalationAfterMinutes: 45,
      reportingWindowHours: 24,
    },
    communicationLinks: [
      {
        id: 1,
        fromAgentId: 2,
        fromAgentName: "Support Orchestrator",
        toAgentId: 1,
        toAgentName: "Finance Sentinel",
        channel: "approval-context",
        protocol: "structured handoff",
        purpose: "Leitet eskalierte Fallakten an den Governance-Agenten zur Risiko- und Freigabeprüfung weiter.",
        lastMessageAt: now - 1000 * 60 * 8,
        status: "active",
        history: [
          {
            id: 1,
            senderAgentId: 2,
            senderAgentName: "Support Orchestrator",
            content: "Fallakte #IR-221 mit Zahlungsstopp und Kundenhistorie zur Freigabeprüfung übergeben.",
            kind: "directive",
            createdAt: now - 1000 * 60 * 22,
          },
          {
            id: 2,
            senderAgentId: 2,
            senderAgentName: "Support Orchestrator",
            content: "Zusätzliche Guardrail-Signale ergänzt: ungewöhnliche Auszahlungshöhe und manueller ERP-Override.",
            kind: "status",
            createdAt: now - 1000 * 60 * 8,
          },
        ],
      },
      {
        id: 2,
        fromAgentId: 3,
        fromAgentName: "Research Navigator",
        toAgentId: 2,
        toAgentName: "Support Orchestrator",
        channel: "briefing-sync",
        protocol: "evidence digest",
        purpose: "Liefert Quellen- und Kontextbriefings für die operative Kundenkommunikation.",
        lastMessageAt: now - 1000 * 60 * 11,
        status: "active",
        history: [
          {
            id: 3,
            senderAgentId: 3,
            senderAgentName: "Research Navigator",
            content: "Lieferantenhistorie, offene Claims und regulatorische Quellen für den Incident gebündelt.",
            kind: "evidence",
            createdAt: now - 1000 * 60 * 27,
          },
          {
            id: 4,
            senderAgentId: 3,
            senderAgentName: "Research Navigator",
            content: "Aktualisierte Quellenlage bestätigt erhöhtes Rückforderungsrisiko bei sofortiger Auszahlung.",
            kind: "evidence",
            createdAt: now - 1000 * 60 * 11,
          },
        ],
      },
      {
        id: 3,
        fromAgentId: 1,
        fromAgentName: "Finance Sentinel",
        toAgentId: 2,
        toAgentName: "Support Orchestrator",
        channel: "decision-feedback",
        protocol: "policy verdict",
        purpose: "Gibt Freigabeergebnisse und Guardrail-Hinweise an den koordinierenden Agenten zurück.",
        lastMessageAt: now - 1000 * 60 * 4,
        status: "active",
        history: [
          {
            id: 5,
            senderAgentId: 1,
            senderAgentName: "Finance Sentinel",
            content: "Freigabe nur mit CFO-Review und zusätzlichem Nachweis zum ERP-Override erteilen.",
            kind: "approval",
            createdAt: now - 1000 * 60 * 15,
          },
          {
            id: 6,
            senderAgentId: 1,
            senderAgentName: "Finance Sentinel",
            content: "Policy-Verstoß markiert, Support-Orchestrierung auf Eskalationspfad umstellen.",
            kind: "approval",
            createdAt: now - 1000 * 60 * 4,
          },
        ],
      },
    ],
  },
];

const policiesData: PolicyRecord[] = [

  {
    id: 1,
    name: "High-value payouts require approval",
    scopeType: "agent",
    scopeRef: "Finance Sentinel",
    actionPattern: "erp.payment.execute",
    effect: "approval_required",
    priority: 10,
    isActive: true,
    description: "Zahlungsvorgänge über dem internen Schwellwert dürfen nur mit menschlicher Freigabe ausgeführt werden.",
  },
  {
    id: 2,
    name: "Customer data export forbidden",
    scopeType: "global",
    scopeRef: "all-agents",
    actionPattern: "crm.customer.export",
    effect: "forbidden",
    priority: 20,
    isActive: true,
    description: "Export sensibler Kundendaten ist global gesperrt.",
  },
  {
    id: 3,
    name: "Browser changes allowed in staging only",
    scopeType: "connector",
    scopeRef: "Browser",
    actionPattern: "browser.form.submit",
    effect: "allowed",
    priority: 40,
    isActive: true,
    description: "Browser-Interaktionen sind im Staging erlaubt und in Produktion gesondert zu prüfen.",
  },
];

const approvalChainTemplatesData: ApprovalChainTemplateRecord[] = [
  {
    id: 1,
    name: "Finance critical disbursement chain",
    description: "Dreistufiges Freigabemuster für hochkritische ERP-Zahlungen mit CFO- und Legal-Eskalation.",
    escalationMode: "auto_escalate",
    calendarProfile: {
      presetId: "finance-controller-critical",
      businessDayStartHour: 8,
      businessDayEndHour: 18,
      workingDays: [1, 2, 3, 4, 5],
      holidayDates: ["2026-01-01", "2026-12-25", "2026-12-26"],
    },
    createdAt: now - 1000 * 60 * 60 * 24 * 14,
    updatedAt: now - 1000 * 60 * 70,
    stages: [
      { id: 1001, stageOrder: 1, stageName: "Finance Ops Review", requiredRole: "approver", defaultApproverLabel: "Finance Operations", slaMinutes: 30, escalationAfterMinutes: 45, escalationTargetLabel: "Head of Finance Operations" },
      { id: 1002, stageOrder: 2, stageName: "CFO Approval", requiredRole: "admin", defaultApproverLabel: "CFO Office", slaMinutes: 45, escalationAfterMinutes: 60, escalationTargetLabel: "Executive Risk Committee" },
      { id: 1003, stageOrder: 3, stageName: "Legal Confirmation", requiredRole: "approver", defaultApproverLabel: "Legal Counsel", slaMinutes: 60, escalationAfterMinutes: 90, escalationTargetLabel: "General Counsel" },
    ],
  },
  {
    id: 2,
    name: "Customer credit escalation chain",
    description: "Zweistufiges Freigabemuster für Kulanzgutschriften mit Customer-Success- und Finance-Review.",
    escalationMode: "serial",
    calendarProfile: {
      presetId: "legal-compliance-medium",
      businessDayStartHour: 9,
      businessDayEndHour: 17,
      workingDays: [1, 2, 3, 4, 5],
      holidayDates: ["2026-01-01", "2026-05-01", "2026-12-25"],
    },
    createdAt: now - 1000 * 60 * 60 * 24 * 9,
    updatedAt: now - 1000 * 60 * 95,
    stages: [
      { id: 2001, stageOrder: 1, stageName: "CS Lead Approval", requiredRole: "approver", defaultApproverLabel: "Customer Success Lead", slaMinutes: 60, escalationAfterMinutes: 90, escalationTargetLabel: "VP Customer Success" },
      { id: 2002, stageOrder: 2, stageName: "Finance Threshold Review", requiredRole: "approver", defaultApproverLabel: "Finance Business Partner", slaMinutes: 45, escalationAfterMinutes: 90, escalationTargetLabel: "Head of Revenue Operations" },
    ],
  },
];

const approvalsData: ApprovalRecord[] = [
  {
    id: 1,
    agentId: 1,
    actionId: 8101,
    agentName: "Finance Sentinel",
    title: "ERP-Zahlung über 18.400 USD",
    summary: "Auszahlung an priorisierten Infrastruktur-Lieferanten wurde wegen Kosten- und Risikoprofil zur mehrstufigen Freigabe angehalten.",
    status: "pending",
    riskLevel: "critical",
    requestedAt: now - 1000 * 60 * 120,
    requestedBy: "Finance Sentinel",
    chainId: 1,
    chainName: "Finance critical disbursement chain",
    escalationStatus: "pending",
    currentStageOrder: 2,
    stages: [
      {
        id: 101,
        order: 1,
        name: "Finance Ops Review",
        requiredRole: "approver",
        ownerLabel: "Finance Operations",
        status: "approved",
        startedAt: now - 1000 * 60 * 118,
        resolvedAt: now - 1000 * 60 * 92,
        slaMinutes: 30,
        escalationAfterMinutes: 45,
        escalationTarget: "Head of Finance Operations",
        note: "Budget und Lieferantendaten geprüft.",
      },
      {
        id: 102,
        order: 2,
        name: "CFO Approval",
        requiredRole: "admin",
        ownerLabel: "CFO Office",
        status: "pending",
        startedAt: now - 1000 * 60 * 76,
        slaMinutes: 45,
        escalationAfterMinutes: 60,
        escalationTarget: "Executive Risk Committee",
      },
      {
        id: 103,
        order: 3,
        name: "Legal Confirmation",
        requiredRole: "approver",
        ownerLabel: "Legal Counsel",
        status: "waiting",
        slaMinutes: 60,
        escalationAfterMinutes: 90,
        escalationTarget: "General Counsel",
      },
    ],
  },
  {
    id: 2,
    agentId: 2,
    actionId: 8102,
    agentName: "Support Orchestrator",
    title: "Kulanzgutschrift für Enterprise-Kunde",
    summary: "Support-Agent hat eine Gutschrift oberhalb der freigegebenen Kulanzgrenze vorgeschlagen und an eine zweistufige Freigabekette übergeben.",
    status: "pending",
    riskLevel: "high",
    requestedAt: now - 1000 * 60 * 46,
    requestedBy: "Support Orchestrator",
    chainId: 2,
    chainName: "Customer credit escalation chain",
    escalationStatus: "none",
    currentStageOrder: 1,
    stages: [
      {
        id: 201,
        order: 1,
        name: "CS Lead Approval",
        requiredRole: "approver",
        ownerLabel: "Customer Success Lead",
        status: "pending",
        startedAt: now - 1000 * 60 * 46,
        slaMinutes: 60,
        escalationAfterMinutes: 90,
        escalationTarget: "VP Customer Success",
      },
      {
        id: 202,
        order: 2,
        name: "Finance Threshold Review",
        requiredRole: "approver",
        ownerLabel: "Finance Business Partner",
        status: "waiting",
        slaMinutes: 45,
        escalationAfterMinutes: 90,
        escalationTarget: "Head of Revenue Operations",
      },
    ],
  },
  {
    id: 3,
    agentId: 1,
    actionId: 8077,
    agentName: "Finance Sentinel",
    title: "Lieferantenänderung im ERP",
    summary: "Kritische Stammdatenänderung wurde nach Vier-Augen-Prüfung und Abschluss der Freigabekette genehmigt.",
    status: "approved",
    riskLevel: "high",
    requestedAt: now - 1000 * 60 * 190,
    requestedBy: "Finance Sentinel",
    approver: "Sophie Keller",
    chainId: 1,
    chainName: "Finance critical disbursement chain",
    escalationStatus: "resolved",
    currentStageOrder: 2,
    stages: [
      {
        id: 301,
        order: 1,
        name: "Finance Ops Review",
        requiredRole: "approver",
        ownerLabel: "Finance Operations",
        status: "approved",
        startedAt: now - 1000 * 60 * 188,
        resolvedAt: now - 1000 * 60 * 178,
        slaMinutes: 30,
        escalationAfterMinutes: 45,
        escalationTarget: "Head of Finance Operations",
      },
      {
        id: 302,
        order: 2,
        name: "CFO Approval",
        requiredRole: "admin",
        ownerLabel: "CFO Office",
        status: "approved",
        startedAt: now - 1000 * 60 * 178,
        resolvedAt: now - 1000 * 60 * 166,
        slaMinutes: 45,
        escalationAfterMinutes: 60,
        escalationTarget: "Executive Risk Committee",
      },
    ],
  },
];

const auditEventsData: AuditEventRecord[] = [
  {
    id: 1,
    agentId: 1,
    agentName: "Finance Sentinel",
    severity: "critical",
    category: "Approval Workflow",
    title: "Aktion in Freigabewarteschlange verschoben",
    detail: "Eine ERP-Zahlung wurde wegen hoher Summe und kritischem Connector in den Approval Workflow überführt.",
    actorType: "system",
    actorRef: "policy-engine",
    createdAt: now - 1000 * 60 * 18,
  },
  {
    id: 2,
    agentId: 2,
    agentName: "Support Orchestrator",
    severity: "warning",
    category: "Runtime Guardrails",
    title: "Fehlerrate oberhalb des Grenzwerts",
    detail: "Die Fehlerrate des Agenten stieg in den letzten 15 Minuten auf 3.8 %.",
    actorType: "system",
    actorRef: "monitoring",
    createdAt: now - 1000 * 60 * 29,
  },
  {
    id: 3,
    agentId: 3,
    agentName: "Research Navigator",
    severity: "info",
    category: "Evaluation Layer",
    title: "Evaluation erfolgreich abgeschlossen",
    detail: "Alle Testfälle für regelkonforme Recherche und Quellenpflicht wurden bestanden.",
    actorType: "user",
    actorRef: "David Brandt",
    createdAt: now - 1000 * 60 * 85,
  },
  {
    id: 4,
    agentId: 1,
    agentName: "Finance Sentinel",
    severity: "info",
    category: "Audit Log",
    title: "Policy-Entscheidung dokumentiert",
    detail: "Die Policy Engine hat eine Aktion als approval_required markiert und revisionssicher protokolliert.",
    actorType: "agent",
    actorRef: "Finance Sentinel",
    createdAt: now - 1000 * 60 * 140,
  },
];

const connectorsData: ConnectorRecord[] = [
  { id: 1, name: "Salesforce CRM", type: "CRM", status: "connected", endpointLabel: "crm-eu-west", authMode: "OAuth 2.0", linkedAgents: 2, lastSyncAt: now - 1000 * 60 * 6 },
  { id: 2, name: "SAP Finance", type: "ERP", status: "connected", endpointLabel: "sap-core", authMode: "Service Account", linkedAgents: 1, lastSyncAt: now - 1000 * 60 * 3 },
  { id: 3, name: "Outlook Mail", type: "E-Mail", status: "degraded", endpointLabel: "exchange-cloud", authMode: "OAuth 2.0", linkedAgents: 2, lastSyncAt: now - 1000 * 60 * 16 },
  { id: 4, name: "Secure Browser Runner", type: "Browser", status: "connected", endpointLabel: "browser-sandbox", authMode: "Session Vault", linkedAgents: 2, lastSyncAt: now - 1000 * 60 * 1 },
  { id: 5, name: "Lakehouse Analytics", type: "Datenbank", status: "connected", endpointLabel: "warehouse-main", authMode: "Key + IP Allowlist", linkedAgents: 2, lastSyncAt: now - 1000 * 60 * 8 },
];

const evaluationsData: EvaluationRecord[] = [
  { id: 1, agentId: 1, agentName: "Finance Sentinel", name: "Quarterly finance control suite", status: "passed", score: 94, policyPassRate: 98, summary: "Kritische Zahlungstests wurden sauber in Freigabeprozesse überführt.", executedAt: now - 1000 * 60 * 210 },
  { id: 2, agentId: 2, agentName: "Support Orchestrator", name: "Customer data protection benchmark", status: "failed", score: 71, policyPassRate: 76, summary: "Ein Teil der Testfälle zeigte zu breite CRM-Kontextnutzung in Antwortentwürfen.", executedAt: now - 1000 * 60 * 95 },
  { id: 3, agentId: 3, agentName: "Research Navigator", name: "Source fidelity evaluation", status: "passed", score: 97, policyPassRate: 100, summary: "Quellenpflicht und Nachweisstruktur wurden über alle Testfälle eingehalten.", executedAt: now - 1000 * 60 * 36 },
];

const guardrailsData: GuardrailRecord[] = [
  { id: 1, agentId: 2, agentName: "Support Orchestrator", triggerType: "latency_spike", status: "monitoring", thresholdLabel: "P95 > 4.0s", detail: "Latenzanstieg nach CRM-Spitzenlast erkannt.", createdAt: now - 1000 * 60 * 27 },
  { id: 2, agentId: 1, agentName: "Finance Sentinel", triggerType: "cost_threshold", status: "stopped", thresholdLabel: "Batch > 25 USD", detail: "Ein außergewöhnlicher Kostenblock wurde automatisch gestoppt und zur Freigabe markiert.", createdAt: now - 1000 * 60 * 44 },
  { id: 3, agentId: 3, agentName: "Research Navigator", triggerType: "tool_anomaly", status: "resolved", thresholdLabel: "Browser step divergence", detail: "Abweichung vom erwarteten Browser-Pfad wurde erkannt und durch erneute Ausführung behoben.", createdAt: now - 1000 * 60 * 132 },
];

const approvalNotificationsData: ApprovalNotificationRecord[] = [
  {
    id: 1,
    approvalId: 1,
    approvalTitle: "Kulanzgutschrift für Enterprise-Kunde · CS Lead Approval",
    severity: "high",
    recipientRole: "approver",
    ownerLabel: "Customer Success Lead",
    escalationTarget: "VP Customer Success",
    actionType: "review",
    channel: "inbox",
    createdAt: now - 1000 * 60 * 25,
  },
  {
    id: 2,
    approvalId: 2,
    approvalTitle: "ERP-Zahlung über 18.400 USD · Finance Threshold Review",
    severity: "critical",
    recipientRole: "admin",
    ownerLabel: "Executive Risk Committee",
    escalationTarget: "Executive Risk Committee",
    actionType: "escalation",
    channel: "inbox",
    createdAt: now - 1000 * 60 * 10,
  },
];

const metricsData: MetricRecord[] = [
  { id: 1, agentId: 1, agentName: "Finance Sentinel", latencyMs: 1620, errorRate: 0.7, apiCostUsd: 4820, tokenUsage: 1840000, windowLabel: "30d", capturedAt: now - 1000 * 60 * 3 },
  { id: 2, agentId: 2, agentName: "Support Orchestrator", latencyMs: 3940, errorRate: 3.8, apiCostUsd: 3150, tokenUsage: 1290000, windowLabel: "30d", capturedAt: now - 1000 * 60 * 4 },
  { id: 3, agentId: 3, agentName: "Research Navigator", latencyMs: 1280, errorRate: 0.4, apiCostUsd: 1240, tokenUsage: 610000, windowLabel: "30d", capturedAt: now - 1000 * 60 * 5 },
];

const metricHistoryData = new Map(
  metricsData.map((metric, index) => [
    metric.id,
    [0, 1, 2, 3, 4, 5].map(offset => ({
      window: `T-${5 - offset}`,
      capturedAt: now - (5 - offset) * 1000 * 60 * 15 - index * 1000 * 60,
      latencyMs: Math.max(900, metric.latencyMs + (offset - 3) * (22 + index * 8)),
      errorRate: Number(Math.max(0.2, metric.errorRate + (offset - 3) * 0.06).toFixed(2)),
      apiCostUsd: Number((metric.apiCostUsd - (5 - offset) * (18 + index * 7)).toFixed(2)),
      tokenUsage: Math.max(1000, metric.tokenUsage - (5 - offset) * (22000 + index * 8000)),
    })),
  ]),
);

const teamsData: TeamRecord[] = [
  { id: 1, name: "Finance Operations", members: 8, owner: "Sophie Keller", coverage: "ERP, Approvals, Audit" },
  { id: 2, name: "Customer Success", members: 14, owner: "Mara Vogt", coverage: "CRM, E-Mail, Browser" },
  { id: 3, name: "Strategy Office", members: 6, owner: "David Brandt", coverage: "Research, Browser, Knowledge" },
];

const permissionsData: PermissionRecord[] = [
  { id: 1, subject: "Sophie Keller", subjectType: "user", agentName: "Finance Sentinel", permissionLevel: "admin", toolScope: "ERP, Datenbank" },
  { id: 2, subject: "Finance Operations", subjectType: "team", agentName: "Finance Sentinel", permissionLevel: "approver", toolScope: "ERP" },
  { id: 3, subject: "Mara Vogt", subjectType: "user", agentName: "Support Orchestrator", permissionLevel: "admin", toolScope: "CRM, E-Mail" },
  { id: 4, subject: "Strategy Office", subjectType: "team", agentName: "Research Navigator", permissionLevel: "operator", toolScope: "Browser, Datenbank" },
];

const APPROVAL_CHAIN_CALENDAR_MARKER = "<!--ACP_CALENDAR_PROFILE:";

function createDefaultStoredCalendarProfile(): ApprovalChainCalendarProfileRecord {
  return {
    presetId: "finance-controller-critical",
    businessDayStartHour: 9,
    businessDayEndHour: 17,
    workingDays: [1, 2, 3, 4, 5],
    holidayDates: ["2026-01-01", "2026-12-25"],
  };
}

function normalizeStoredCalendarProfile(profile?: Partial<ApprovalChainCalendarProfileRecord> | null): ApprovalChainCalendarProfileRecord {
  const fallback = createDefaultStoredCalendarProfile();
  return {
    presetId: profile?.presetId?.trim() || fallback.presetId,
    businessDayStartHour: profile?.businessDayStartHour ?? fallback.businessDayStartHour,
    businessDayEndHour: profile?.businessDayEndHour ?? fallback.businessDayEndHour,
    workingDays: profile?.workingDays?.length ? [...profile.workingDays] : [...fallback.workingDays],
    holidayDates: profile?.holidayDates?.filter(Boolean) ?? [...fallback.holidayDates],
  };
}

function encodeApprovalChainDescription(description: string, calendarProfile: ApprovalChainCalendarProfileRecord): string {
  const cleanedDescription = description.trim();
  return `${cleanedDescription}\n${APPROVAL_CHAIN_CALENDAR_MARKER}${JSON.stringify(calendarProfile)}-->`;
}

function decodeApprovalChainDescription(storedDescription?: string | null) {
  const raw = storedDescription ?? "";
  const markerIndex = raw.lastIndexOf(APPROVAL_CHAIN_CALENDAR_MARKER);
  if (markerIndex === -1) {
    return {
      description: raw,
      calendarProfile: createDefaultStoredCalendarProfile(),
    };
  }

  const payloadStart = markerIndex + APPROVAL_CHAIN_CALENDAR_MARKER.length;
  const payloadEnd = raw.indexOf("-->", payloadStart);
  if (payloadEnd === -1) {
    return {
      description: raw,
      calendarProfile: createDefaultStoredCalendarProfile(),
    };
  }

  try {
    return {
      description: raw.slice(0, markerIndex).trim(),
      calendarProfile: normalizeStoredCalendarProfile(JSON.parse(raw.slice(payloadStart, payloadEnd)) as ApprovalChainCalendarProfileRecord),
    };
  } catch {
    return {
      description: raw,
      calendarProfile: createDefaultStoredCalendarProfile(),
    };
  }
}

function cloneApprovalChainTemplate(chain: ApprovalChainTemplateRecord): ApprovalChainTemplateRecord {
  return {
    ...chain,
    calendarProfile: {
      ...chain.calendarProfile,
      workingDays: [...chain.calendarProfile.workingDays],
      holidayDates: [...chain.calendarProfile.holidayDates],
    },
    stages: chain.stages.map(stage => ({ ...stage })),
  };
}

async function ensureApprovalChainSeeded() {
  if (approvalChainSeedChecked) {
    return;
  }

  const db = await getDb();
  if (!db) {
    approvalChainSeedChecked = true;
    return;
  }

  const existingChains = await db.select().from(approvalChains);
  if (existingChains.length === 0) {
    await db.insert(approvalChains).values(
      approvalChainTemplatesData.map(chain => ({
        id: chain.id,
        name: chain.name,
        description: encodeApprovalChainDescription(chain.description, chain.calendarProfile),
        escalationMode: chain.escalationMode,
        createdAt: new Date(chain.createdAt),
        updatedAt: new Date(chain.updatedAt),
      })),
    );

    await db.insert(approvalStages).values(
      approvalChainTemplatesData.flatMap(chain =>
        chain.stages.map(stage => ({
          id: stage.id,
          chainId: chain.id,
          stageOrder: stage.stageOrder,
          stageName: stage.stageName,
          requiredRole: stage.requiredRole,
          defaultApproverLabel: stage.defaultApproverLabel,
          stageMode: stage.stageMode ?? "serial",
          laneKey: stage.laneKey ?? "main",
          branchSourceStageOrder: stage.branchSourceStageOrder ?? null,
          branchLabel: stage.branchLabel ?? null,
          branchField: stage.branchField ?? "riskLevel",
          branchOperator: stage.branchOperator ?? "always",
          branchValue: stage.branchValue ?? null,
          quorumMode: stage.quorumMode ?? "all",
          quorumTarget: stage.quorumTarget ?? 1,
          slaMinutes: stage.slaMinutes,
          escalationAfterMinutes: stage.escalationAfterMinutes,
          escalationTargetLabel: stage.escalationTargetLabel,
          createdAt: new Date(chain.createdAt),
        })),
      ),
    );
  }

  approvalChainSeedChecked = true;
}

function getCurrentApprovalStage(approval: ApprovalRecord) {
  return approval.stages.find(stage => stage.order === approval.currentStageOrder && (stage.status === "pending" || stage.status === "escalated"));
}

function getApprovalBranchSignals(approval: ApprovalRecord) {
  return {
    riskLevel: approval.riskLevel,
    requestedBy: approval.requestedBy,
    agentName: approval.agentName,
    title: approval.title,
    summary: approval.summary,
    chainName: approval.chainName,
    escalationStatus: approval.escalationStatus,
  } satisfies Record<BranchSignalKey, string>;
}

function evaluateBranchCondition(stage: ApprovalStageRecord, approval: ApprovalRecord) {
  if (stage.stageMode !== "branch") return false;
  const signals = getApprovalBranchSignals(approval);
  const signalKey = stage.branchField ?? "riskLevel";
  const left = String(signals[signalKey] ?? "").trim().toLowerCase();
  const right = (stage.branchValue ?? "").trim().toLowerCase();

  switch (stage.branchOperator ?? "always") {
    case "always":
      return true;
    case "equals":
      return left.length > 0 && right.length > 0 && left === right;
    case "contains":
      return left.length > 0 && right.length > 0 && left.includes(right);
    case "greater_than": {
      const leftNumber = Number(left);
      const rightNumber = Number(right);
      return Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber > rightNumber;
    }
    case "less_than": {
      const leftNumber = Number(left);
      const rightNumber = Number(right);
      return Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber < rightNumber;
    }
    default:
      return false;
  }
}

function activateStages(stages: ApprovalStageRecord[]) {
  const timestamp = Date.now();
  stages.forEach(stage => {
    if (stage.status === "waiting") {
      stage.status = "pending";
      stage.startedAt = timestamp;
    }
  });
}

function getCurrentParallelGroup(approval: ApprovalRecord) {
  const orderedStages = [...approval.stages].sort((a, b) => a.order - b.order);
  const currentIndex = orderedStages.findIndex(stage => stage.order === approval.currentStageOrder);
  const currentStage = currentIndex >= 0 ? orderedStages[currentIndex] : null;
  if (!currentStage || currentStage.stageMode !== "parallel") {
    return [] as ApprovalStageRecord[];
  }

  let startIndex = currentIndex;
  while (startIndex > 0 && orderedStages[startIndex - 1]?.stageMode === "parallel") {
    startIndex -= 1;
  }

  let endIndex = currentIndex;
  while (endIndex < orderedStages.length - 1 && orderedStages[endIndex + 1]?.stageMode === "parallel") {
    endIndex += 1;
  }

  return orderedStages
    .slice(startIndex, endIndex + 1)
    .filter(stage => stage.status !== "waiting" && stage.status !== "rejected")
    .sort((a, b) => a.order - b.order);
}

function getParallelQuorumConfig(group: ApprovalStageRecord[]) {
  const source = group[0];
  return {
    quorumMode: source?.quorumMode ?? "all",
    quorumTarget: Math.max(1, source?.quorumTarget ?? 1),
  } as const;
}

function hasParallelGroupReachedQuorum(group: ApprovalStageRecord[]) {
  if (group.length === 0) {
    return false;
  }

  const approved = group.filter(stage => stage.status === "approved");
  const { quorumMode, quorumTarget } = getParallelQuorumConfig(group);

  switch (quorumMode) {
    case "majority":
      return approved.length >= Math.ceil(group.length / 2);
    case "minimum_count":
      return approved.length >= Math.min(group.length, quorumTarget);
    case "distinct_roles": {
      const distinctRoles = new Set(approved.map(stage => stage.requiredRole));
      return distinctRoles.size >= Math.min(new Set(group.map(stage => stage.requiredRole)).size, quorumTarget);
    }
    case "all":
    default:
      return approved.length === group.length;
  }
}

function finalizeParallelGroupAfterQuorum(group: ApprovalStageRecord[], approver: string) {
  const timestamp = Date.now();
  group.forEach(stage => {
    if (stage.status === "pending" || stage.status === "escalated") {
      stage.status = "approved";
      stage.resolvedAt = timestamp;
      stage.note = stage.note
        ? `${stage.note} | Automatisch abgeschlossen, nachdem das Quorum durch ${approver} erreicht wurde.`
        : `Automatisch abgeschlossen, nachdem das Quorum durch ${approver} erreicht wurde.`;
    }
  });
}

function getNextStagesAfterApproval(approval: ApprovalRecord, approvedStage: ApprovalStageRecord) {
  const remaining = approval.stages
    .filter(stage => stage.status === "waiting")
    .sort((a, b) => a.order - b.order);

  if (approvedStage.stageMode === "parallel") {
    const parallelGroup = getCurrentParallelGroup(approval);
    if (!hasParallelGroupReachedQuorum(parallelGroup)) {
      return [] as ApprovalStageRecord[];
    }
  }

  const branchStages = remaining.filter(stage => stage.stageMode === "branch" && stage.branchSourceStageOrder === approvedStage.order && evaluateBranchCondition(stage, approval));
  if (branchStages.length > 0) {
    return branchStages;
  }

  const nextSequential = remaining.find(stage => stage.order > approvedStage.order && stage.stageMode !== "branch");
  if (!nextSequential) {
    return [] as ApprovalStageRecord[];
  }

  if (nextSequential.stageMode === "parallel") {
    return remaining.filter(stage => stage.stageMode === "parallel" && stage.order >= nextSequential.order);
  }

  return [nextSequential];
}

function addAuditEvent(event: Omit<AuditEventRecord, "id" | "createdAt"> & { createdAt?: number }) {
  auditEventsData.unshift({
    id: auditEventsData.length + 1,
    createdAt: event.createdAt ?? Date.now(),
    ...event,
    title: sanitizeTextForPrivacy(event.title).sanitizedText,
    detail: sanitizeTextForPrivacy(event.detail).sanitizedText,
    actorRef: sanitizeTextForPrivacy(event.actorRef).sanitizedText,
  });
}

function synchronizeApprovalEscalations() {
  const currentTime = Date.now();
  approvalsData.forEach(approval => {
    if (approval.status !== "pending") return;
    const stage = getCurrentApprovalStage(approval);
    if (!stage) return;
    if (stage.status !== "pending") return;
    if (!stage.startedAt) return;
    const elapsedMinutes = (currentTime - stage.startedAt) / 60000;
    if (elapsedMinutes < stage.escalationAfterMinutes) return;

    stage.status = "escalated";
    stage.ownerLabel = stage.escalationTarget;
    stage.escalationTriggeredAt = currentTime;
    stage.note = `Automatisch eskaliert nach ${stage.escalationAfterMinutes} Minuten.`;
    approval.escalationStatus = "escalated";

    addAuditEvent({
      agentId: approval.agentId,
      agentName: approval.agentName,
      severity: "warning",
      category: "Approval Workflow",
      title: "Approval-Stufe eskaliert",
      detail: `Die Stufe \"${stage.name}\" für \"${approval.title}\" wurde an ${stage.ownerLabel} eskaliert.`,
      actorType: "system",
      actorRef: "approval-escalation-engine",
    });
  });
}

function refreshLiveMetrics() {
  const tick = Math.floor(Date.now() / 15000);
  metricsData.forEach((metric, index) => {
    const direction = (tick + index) % 2 === 0 ? 1 : -1;
    metric.latencyMs = Math.max(900, metric.latencyMs + direction * (20 + index * 12));
    metric.errorRate = Number(Math.max(0.2, metric.errorRate + direction * 0.08).toFixed(2));
    metric.apiCostUsd = Number((metric.apiCostUsd + 6 + index * 3).toFixed(2));
    metric.tokenUsage = metric.tokenUsage + 1800 + index * 700;
    metric.capturedAt = Date.now();

    const history = metricHistoryData.get(metric.id) ?? [];
    const latest = history[history.length - 1];
    if (!latest || metric.capturedAt - latest.capturedAt >= 1000 * 10) {
      history.push({
        window: `T+${history.length + 1}`,
        capturedAt: metric.capturedAt,
        latencyMs: metric.latencyMs,
        errorRate: metric.errorRate,
        apiCostUsd: metric.apiCostUsd,
        tokenUsage: metric.tokenUsage,
      });
    } else {
      history[history.length - 1] = {
        ...latest,
        capturedAt: metric.capturedAt,
        latencyMs: metric.latencyMs,
        errorRate: metric.errorRate,
        apiCostUsd: metric.apiCostUsd,
        tokenUsage: metric.tokenUsage,
      };
    }

    const trimmed = history.slice(-6).map((point, pointIndex, array) => ({
      ...point,
      window: pointIndex === array.length - 1 ? "Jetzt" : `T-${array.length - pointIndex - 1}`,
    }));
    metricHistoryData.set(metric.id, trimmed);
  });
}

export async function getDashboardOverview() {
  synchronizeApprovalEscalations();
  refreshLiveMetrics();
  const activeAgents = agentsData.filter(agent => agent.status !== "offline").length;
  const pendingApprovals = approvalsData.filter(approval => approval.status === "pending").length;
  const auditEvents = auditEventsData.length;
  const totalCost = metricsData.reduce((sum, item) => sum + item.apiCostUsd, 0);
  const avgLatency = Math.round(metricsData.reduce((sum, item) => sum + item.latencyMs, 0) / metricsData.length);
  const errorRate = Number((metricsData.reduce((sum, item) => sum + item.errorRate, 0) / metricsData.length).toFixed(2));
  const totalTokens = metricsData.reduce((sum, item) => sum + item.tokenUsage, 0);

  return {
    stats: {
      activeAgents,
      pendingApprovals,
      auditEvents,
      totalCost,
      avgLatency,
      errorRate,
      totalTokens,
    },
    agentStatusDistribution: {
      healthy: agentsData.filter(agent => agent.status === "healthy").length,
      warning: agentsData.filter(agent => agent.status === "warning").length,
      paused: agentsData.filter(agent => agent.status === "paused").length,
      offline: agentsData.filter(agent => agent.status === "offline").length,
    },
    riskDistribution: {
      low: agentsData.filter(agent => agent.riskLevel === "low").length,
      medium: agentsData.filter(agent => agent.riskLevel === "medium").length,
      high: agentsData.filter(agent => agent.riskLevel === "high").length,
      critical: agentsData.filter(agent => agent.riskLevel === "critical").length,
    },
    recentAuditEvents: auditEventsData.slice(0, 4),
    pendingApprovals: approvalsData.filter(approval => approval.status === "pending"),
    topAgents: agentsData,
    guardrailHighlights: guardrailsData,
  };
}

export async function listAgents() {
  return [...agentsData].sort((a, b) => a.name.localeCompare(b.name));
}

type AgentMutationInput = {
  name: string;
  description: string;
  team: string;
  owner: string;
  model: string;
  environment: string;
};

type AgentSwarmMemberInput = {
  name: string;
  role: string;
  description: string;
  model: string;
  tools: string[];
};

type AgentSwarmMutationInput = {
  name: string;
  mission: string;
  topology: AgentSwarmTopology;
  coordinationMode: AgentSwarmCoordinationMode;
  team: string;
  owner: string;
  environment: string;
  governance: AgentSwarmGovernanceRecord;
  members: AgentSwarmMemberInput[];
};

type AgentSwarmDissolveMode = "retain_agents" | "remove_agents";

function buildSwarmMessageHistory(from: AgentRecord, to: AgentRecord, channel: string, purpose: string, createdAt: number) {
  const firstKind = channel.includes("brief") ? "evidence" : channel.includes("result") ? "status" : channel.includes("approval") ? "approval" : "directive";

  return [
    {
      id: nextSwarmMessageId++,
      senderAgentId: from.id,
      senderAgentName: from.name,
      content: `${from.name} startet den Kommunikationspfad ${channel} für ${to.name}. Fokus: ${purpose}`,
      kind: firstKind as AgentSwarmMessageRecord["kind"],
      createdAt,
    },
    {
      id: nextSwarmMessageId++,
      senderAgentId: from.id,
      senderAgentName: from.name,
      content: `${from.name} übermittelt ein strukturiertes Update an ${to.name}, damit der Schwarm ohne Medienbruch weiterarbeiten kann.`,
      kind: "status" as const,
      createdAt: createdAt + 1000 * 60 * 3,
    },
  ];
}

function buildSwarmCommunicationLinks(swarmId: number, members: AgentRecord[], topology: AgentSwarmTopology) {
  const pairs: Array<{ from: AgentRecord; to: AgentRecord; channel: string; protocol: string; purpose: string }> = [];

  if (topology === "pipeline") {
    members.slice(0, -1).forEach((member, index) => {
      pairs.push({
        from: member,
        to: members[index + 1],
        channel: "pipeline-handoff",
        protocol: "stage handoff",
        purpose: `${member.name} übergibt strukturierte Arbeitspakete an ${members[index + 1].name}.`,
      });
    });
  } else if (topology === "hub_spoke") {
    const coordinator = members[0];
    members.slice(1).forEach(member => {
      pairs.push({
        from: coordinator,
        to: member,
        channel: "coordination-brief",
        protocol: "supervisor tasking",
        purpose: `${coordinator.name} verteilt Teilaufgaben an ${member.name}.`,
      });
      pairs.push({
        from: member,
        to: coordinator,
        channel: "result-return",
        protocol: "status callback",
        purpose: `${member.name} meldet Ergebnisse und Risiken an ${coordinator.name} zurück.`,
      });
    });
  } else {
    members.forEach((from, fromIndex) => {
      members.forEach((to, toIndex) => {
        if (fromIndex < toIndex) {
          pairs.push({
            from,
            to,
            channel: "peer-sync",
            protocol: "mesh exchange",
            purpose: `${from.name} und ${to.name} tauschen Zwischenstände für gemeinsame Entscheidungen aus.`,
          });
        }
      });
    });
  }

  return pairs.map(pair => {
    const history = buildSwarmMessageHistory(pair.from, pair.to, pair.channel, pair.purpose, Date.now() - 1000 * 60 * 12);
    return {
      id: nextSwarmCommunicationId++,
      fromAgentId: pair.from.id,
      fromAgentName: pair.from.name,
      toAgentId: pair.to.id,
      toAgentName: pair.to.name,
      channel: pair.channel,
      protocol: pair.protocol,
      purpose: pair.purpose,
      lastMessageAt: history[history.length - 1]?.createdAt ?? Date.now(),
      status: "active" as const,
      history,
      swarmId,
    };
  }).map(({ swarmId: _swarmId, ...link }) => link);
}

export async function createAgent(input: AgentMutationInput) {
  const newAgent: AgentRecord = {
    id: nextAgentId++,
    name: input.name,
    description: input.description,
    status: "healthy",
    riskLevel: "medium",
    team: input.team,
    owner: input.owner,
    model: input.model,
    environment: input.environment,
    policyMode: "monitoring",
    lastHeartbeat: Date.now(),
    monthlyCostUsd: 0,
    tokenUsage: 0,
    successRate: 100,
    tools: [],
  };
  agentsData.unshift(newAgent);
  return newAgent;
}

export async function updateAgent(input: AgentMutationInput & { id: number }) {
  const existingAgent = agentsData.find(agent => agent.id === input.id);

  if (!existingAgent) {
    throw new Error(`Agent ${input.id} wurde nicht gefunden.`);
  }

  existingAgent.name = input.name;
  existingAgent.description = input.description;
  existingAgent.team = input.team;
  existingAgent.owner = input.owner;
  existingAgent.model = input.model;
  existingAgent.environment = input.environment;
  existingAgent.lastHeartbeat = Date.now();

  return existingAgent;
}

export async function duplicateAgent(input: AgentMutationInput & { sourceAgentId: number }) {
  const sourceAgent = agentsData.find(agent => agent.id === input.sourceAgentId);

  if (!sourceAgent) {
    throw new Error(`Agent ${input.sourceAgentId} wurde nicht gefunden.`);
  }

  const duplicatedAgent: AgentRecord = {
    ...sourceAgent,
    id: nextAgentId++,
    name: input.name,
    description: input.description,
    team: input.team,
    owner: input.owner,
    model: input.model,
    environment: input.environment,
    status: "healthy",
    lastHeartbeat: Date.now(),
    monthlyCostUsd: 0,
    tokenUsage: 0,
    tools: [...sourceAgent.tools],
  };

  agentsData.unshift(duplicatedAgent);
  return duplicatedAgent;
}

function cloneAgentSwarm(swarm: AgentSwarmRecord) {
  return {
    ...swarm,
    memberAgentIds: [...swarm.memberAgentIds],
    communicationLinks: [...swarm.communicationLinks]
      .map(link => ({
        ...link,
        history: [...link.history].sort((a, b) => a.createdAt - b.createdAt),
      }))
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt),
    governance: { ...swarm.governance },
  };
}

function getSwarmMessageFingerprint(message: Pick<AgentSwarmMessageRecord, "senderAgentId" | "content" | "kind" | "createdAt">) {
  return `${message.senderAgentId}:${message.kind}:${message.createdAt}:${message.content}`;
}

async function syncPersistedSwarmMessagesForSwarm(swarm: AgentSwarmRecord) {
  const db = await getDb();
  if (!db) {
    return;
  }

  await db.delete(swarmMessages).where(eq(swarmMessages.swarmId, swarm.id));

  const rows = swarm.communicationLinks.flatMap(link =>
    link.history.map(message => ({
      swarmId: swarm.id,
      communicationLinkId: link.id,
      senderAgentId: message.senderAgentId,
      senderAgentName: message.senderAgentName,
      content: message.content,
      kind: message.kind,
      createdAt: new Date(message.createdAt),
    })),
  );

  if (rows.length > 0) {
    await db.insert(swarmMessages).values(rows);
  }
}

async function loadPersistedSwarmMessages(swarm: AgentSwarmRecord) {
  const db = await getDb();
  const clone = cloneAgentSwarm(swarm);
  if (!db) {
    return clone;
  }

  const persistedMessages = await db.select().from(swarmMessages).where(eq(swarmMessages.swarmId, swarm.id));
  if (persistedMessages.length === 0) {
    return clone;
  }

  const messageMap = new Map<number, AgentSwarmMessageRecord[]>();
  persistedMessages.forEach(message => {
    const bucket = messageMap.get(message.communicationLinkId) ?? [];
    bucket.push({
      id: message.id,
      senderAgentId: message.senderAgentId,
      senderAgentName: message.senderAgentName,
      content: message.content,
      kind: message.kind,
      createdAt: message.createdAt.getTime(),
    });
    messageMap.set(message.communicationLinkId, bucket);
  });

  clone.communicationLinks = clone.communicationLinks
    .map(link => {
      const seen = new Set(link.history.map(getSwarmMessageFingerprint));
      const persistedHistory = (messageMap.get(link.id) ?? []).filter(message => {
        const fingerprint = getSwarmMessageFingerprint(message);
        if (seen.has(fingerprint)) {
          return false;
        }
        seen.add(fingerprint);
        return true;
      });
      const history = [...link.history, ...persistedHistory].sort((a, b) => a.createdAt - b.createdAt);
      const lastMessageAt = history.length > 0 ? history[history.length - 1]!.createdAt : link.lastMessageAt;
      return {
        ...link,
        history,
        lastMessageAt,
      };
    })
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

  return clone;
}

function createSwarmMembers(swarmId: number, input: AgentSwarmMutationInput, createdAt: number) {
  return input.members.map((member, index) => ({
    id: nextAgentId++,
    name: member.name,
    description: member.description,
    status: "healthy" as const,
    riskLevel: index === 0 ? "high" as const : "medium" as const,
    team: input.team,
    owner: input.owner,
    model: member.model,
    environment: input.environment,
    policyMode: input.governance.policyMode === "approval_required" ? "approval-aware" : input.governance.policyMode,
    lastHeartbeat: createdAt,
    monthlyCostUsd: 0,
    tokenUsage: 0,
    successRate: 100,
    tools: member.tools,
    swarmId,
    swarmName: input.name,
    swarmRole: member.role,
    communicationMode: input.coordinationMode,
  }));
}

export async function listAgentSwarms() {
  const swarms = await Promise.all(agentSwarmsData.map(swarm => loadPersistedSwarmMessages(swarm)));
  return swarms.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createAgentSwarm(input: AgentSwarmMutationInput) {
  if (input.members.length < 2) {
    throw new Error("Ein Agenten-Schwarm benötigt mindestens zwei Mitglieder.");
  }

  const swarmId = nextSwarmId++;
  const createdAt = Date.now();
  const swarmMembers = createSwarmMembers(swarmId, input, createdAt);

  const communicationLinks = buildSwarmCommunicationLinks(swarmId, swarmMembers, input.topology);
  const swarm: AgentSwarmRecord = {
    id: swarmId,
    name: input.name,
    mission: input.mission,
    topology: input.topology,
    coordinationMode: input.coordinationMode,
    team: input.team,
    owner: input.owner,
    environment: input.environment,
    createdAt,
    memberAgentIds: swarmMembers.map(member => member.id),
    communicationLinks,
    governance: { ...input.governance },
  };

  agentsData.unshift(...swarmMembers.slice().reverse());
  agentSwarmsData.unshift(swarm);
  await syncPersistedSwarmMessagesForSwarm(swarm);
  return {
    ...(await loadPersistedSwarmMessages(swarm)),
    members: swarmMembers,
  };
}

export async function updateAgentSwarm(input: AgentSwarmMutationInput & { id: number }) {
  const swarm = agentSwarmsData.find(item => item.id === input.id);

  if (!swarm) {
    throw new Error(`Agenten-Schwarm ${input.id} wurde nicht gefunden.`);
  }

  if (input.members.length < 2) {
    throw new Error("Ein Agenten-Schwarm benötigt mindestens zwei Mitglieder.");
  }

  const previousMemberIds = new Set(swarm.memberAgentIds);
  for (let index = agentsData.length - 1; index >= 0; index -= 1) {
    if (previousMemberIds.has(agentsData[index]!.id)) {
      agentsData.splice(index, 1);
    }
  }

  const createdAt = swarm.createdAt;
  const swarmMembers = createSwarmMembers(swarm.id, input, createdAt);
  swarm.name = input.name;
  swarm.mission = input.mission;
  swarm.topology = input.topology;
  swarm.coordinationMode = input.coordinationMode;
  swarm.team = input.team;
  swarm.owner = input.owner;
  swarm.environment = input.environment;
  swarm.governance = { ...input.governance };
  swarm.memberAgentIds = swarmMembers.map(member => member.id);
  swarm.communicationLinks = buildSwarmCommunicationLinks(swarm.id, swarmMembers, input.topology);

  agentsData.unshift(...swarmMembers.slice().reverse());
  await syncPersistedSwarmMessagesForSwarm(swarm);
  return {
    ...(await loadPersistedSwarmMessages(swarm)),
    members: swarmMembers,
  };
}

export async function dissolveAgentSwarm(input: { id: number; mode: AgentSwarmDissolveMode }) {
  const swarmIndex = agentSwarmsData.findIndex(item => item.id === input.id);

  if (swarmIndex === -1) {
    throw new Error(`Agenten-Schwarm ${input.id} wurde nicht gefunden.`);
  }

  const swarm = agentSwarmsData[swarmIndex]!;
  const memberIds = new Set(swarm.memberAgentIds);

  if (input.mode === "remove_agents") {
    for (let index = agentsData.length - 1; index >= 0; index -= 1) {
      if (memberIds.has(agentsData[index]!.id)) {
        agentsData.splice(index, 1);
      }
    }
  } else {
    agentsData.forEach(agent => {
      if (memberIds.has(agent.id)) {
        agent.swarmId = null;
        agent.swarmName = null;
        agent.swarmRole = null;
        agent.communicationMode = null;
      }
    });
  }

  const db = await getDb();
  if (db) {
    await db.delete(swarmMessages).where(eq(swarmMessages.swarmId, swarm.id));
  }

  agentSwarmsData.splice(swarmIndex, 1);
  return {
    id: input.id,
    mode: input.mode,
    removedMembers: memberIds.size,
  };
}

export async function postAgentSwarmMessage(input: {
  swarmId: number;
  communicationLinkId: number;
  senderAgentId: number;
  content: string;
  kind: AgentSwarmMessageRecord["kind"];
}) {
  const swarm = agentSwarmsData.find(item => item.id === input.swarmId);

  if (!swarm) {
    throw new Error(`Agenten-Schwarm ${input.swarmId} wurde nicht gefunden.`);
  }

  const link = swarm.communicationLinks.find(item => item.id === input.communicationLinkId);
  if (!link) {
    throw new Error(`Kommunikationspfad ${input.communicationLinkId} wurde nicht gefunden.`);
  }

  if (link.fromAgentId !== input.senderAgentId) {
    throw new Error("Nachrichten dürfen nur vom definierten Quellagenten des Kommunikationspfads gesendet werden.");
  }

  const isSensitiveAction = /deploy|payment|delete|transfer|production/i.test(input.content);
  if (isSensitiveAction && swarm.governance.approvalRequired && input.kind !== "approval") {
    throw new Error(`Schwarm-Governance verlangt vor sensiblen Aktionen eine Freigabe der Rolle ${swarm.governance.approverRole}.`);
  }

  if (isSensitiveAction && swarm.governance.policyMode === "enforced" && input.kind === "approval") {
    throw new Error(`Schwarm-Governance blockiert diese Aktion im Durchsetzungsmodus und eskaliert an ${swarm.governance.escalationTarget}.`);
  }

  const message = {
    id: nextSwarmMessageId++,
    senderAgentId: input.senderAgentId,
    senderAgentName: link.fromAgentName,
    content: input.content,
    kind: input.kind,
    createdAt: Date.now(),
  };

  link.history.push(message);
  link.lastMessageAt = message.createdAt;
  link.status = isSensitiveAction && input.kind === "approval" ? "degraded" : "active";

  const db = await getDb();
  if (db) {
    await db.insert(swarmMessages).values({
      swarmId: swarm.id,
      communicationLinkId: link.id,
      senderAgentId: message.senderAgentId,
      senderAgentName: message.senderAgentName,
      content: message.content,
      kind: message.kind,
      createdAt: new Date(message.createdAt),
    });
  }

  return {
    ...link,
    history: [...link.history],
  };
}

export async function listPolicies() {
  return [...policiesData].sort((a, b) => a.priority - b.priority);
}

export async function createPolicy(input: {
  name: string;
  scopeType: string;
  scopeRef: string;
  actionPattern: string;
  effect: PolicyEffect;
  priority: number;
  description: string;
}) {
  const newPolicy: PolicyRecord = {
    id: nextPolicyId++,
    name: input.name,
    scopeType: input.scopeType,
    scopeRef: input.scopeRef,
    actionPattern: input.actionPattern,
    effect: input.effect,
    priority: input.priority,
    isActive: true,
    description: input.description,
  };
  policiesData.unshift(newPolicy);
  return newPolicy;
}

export async function listApprovalChains() {
  const db = await getDb();
  if (!db) {
    return [...approvalChainTemplatesData]
      .map(cloneApprovalChainTemplate)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  await ensureApprovalChainSeeded();
  const [chains, stages] = await Promise.all([
    db.select().from(approvalChains),
    db.select().from(approvalStages),
  ]);

  return chains
    .map(chain => {
      const metadata = decodeApprovalChainDescription(chain.description);
      return {
        id: chain.id,
        name: chain.name,
        description: metadata.description,
        escalationMode: chain.escalationMode,
        calendarProfile: metadata.calendarProfile,
        createdAt: chain.createdAt.getTime(),
        updatedAt: chain.updatedAt.getTime(),
        stages: stages
          .filter(stage => stage.chainId === chain.id)
          .sort((a, b) => a.stageOrder - b.stageOrder)
          .map(stage => ({
            id: stage.id,
            stageOrder: stage.stageOrder,
            stageName: stage.stageName,
            requiredRole: stage.requiredRole,
            defaultApproverLabel: stage.defaultApproverLabel,
            stageMode: stage.stageMode,
            laneKey: stage.laneKey,
            branchSourceStageOrder: stage.branchSourceStageOrder,
            branchLabel: stage.branchLabel,
            branchField: stage.branchField,
            branchOperator: stage.branchOperator,
            branchValue: stage.branchValue,
            quorumMode: stage.quorumMode,
            quorumTarget: stage.quorumTarget,
            slaMinutes: stage.slaMinutes,
            escalationAfterMinutes: stage.escalationAfterMinutes,
            escalationTargetLabel: stage.escalationTargetLabel,
          })),
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function createApprovalChainTemplate(input: {
  name: string;
  description: string;
  escalationMode: "serial" | "parallel" | "auto_escalate";
  calendarProfile?: Partial<ApprovalChainCalendarProfileRecord>;
  stages: Array<{
    stageName: string;
    requiredRole: string;
    defaultApproverLabel: string;
    stageMode: "serial" | "parallel" | "branch";
    laneKey: string;
    branchSourceStageOrder?: number | null;
    branchLabel?: string;
    branchField?: BranchSignalKey;
    branchOperator: "always" | "equals" | "contains" | "greater_than" | "less_than";
    branchValue?: string;
    quorumMode?: ParallelQuorumMode;
    quorumTarget?: number;
    slaMinutes: number;
    escalationAfterMinutes: number;
    escalationTargetLabel: string;
  }>;
}) {
  const timestamp = Date.now();
  const db = await getDb();

  if (!db) {
    const chain: ApprovalChainTemplateRecord = {
      id: nextApprovalChainId++,
      name: input.name,
      description: input.description,
      escalationMode: input.escalationMode,
      calendarProfile: normalizeStoredCalendarProfile(input.calendarProfile),
      createdAt: timestamp,
      updatedAt: timestamp,
      stages: input.stages.map((stage, index) => ({
        id: nextApprovalStageTemplateId++,
        stageOrder: index + 1,
        stageName: stage.stageName,
        requiredRole: stage.requiredRole,
        defaultApproverLabel: stage.defaultApproverLabel,
        stageMode: stage.stageMode,
        laneKey: stage.laneKey,
        branchSourceStageOrder: stage.branchSourceStageOrder ?? null,
        branchLabel: stage.branchLabel ?? "",
        branchField: stage.branchField ?? "riskLevel",
        branchOperator: stage.branchOperator,
        branchValue: stage.branchValue ?? "",
        quorumMode: stage.quorumMode ?? "all",
        quorumTarget: stage.quorumTarget ?? 1,
        slaMinutes: stage.slaMinutes,
        escalationAfterMinutes: stage.escalationAfterMinutes,
        escalationTargetLabel: stage.escalationTargetLabel,
      })),
    };
    approvalChainTemplatesData.unshift(chain);
    return cloneApprovalChainTemplate(chain);
  }

  await ensureApprovalChainSeeded();
  const existingChains = await db.select().from(approvalChains);
  const existingStages = await db.select().from(approvalStages);
  const chainId = Math.max(0, ...existingChains.map(chain => chain.id)) + 1;
  let nextStageId = Math.max(0, ...existingStages.map(stage => stage.id)) + 1;

  await db.insert(approvalChains).values({
    id: chainId,
    name: input.name,
    description: encodeApprovalChainDescription(input.description, normalizeStoredCalendarProfile(input.calendarProfile)),
    escalationMode: input.escalationMode,
    createdAt: new Date(timestamp),
    updatedAt: new Date(timestamp),
  });

  await db.insert(approvalStages).values(
    input.stages.map((stage, index) => ({
      id: nextStageId++,
      chainId,
      stageOrder: index + 1,
      stageName: stage.stageName,
      requiredRole: stage.requiredRole,
      defaultApproverLabel: stage.defaultApproverLabel,
      stageMode: stage.stageMode,
      laneKey: stage.laneKey,
      branchSourceStageOrder: stage.branchSourceStageOrder ?? null,
      branchLabel: stage.branchLabel ?? null,
      branchField: stage.branchField ?? "riskLevel",
      branchOperator: stage.branchOperator,
      branchValue: stage.branchValue ?? null,
      quorumMode: stage.quorumMode ?? "all",
      quorumTarget: stage.quorumTarget ?? 1,
      slaMinutes: stage.slaMinutes,
      escalationAfterMinutes: stage.escalationAfterMinutes,
      escalationTargetLabel: stage.escalationTargetLabel,
      createdAt: new Date(timestamp),
    })),
  );

  const chains = await listApprovalChains();
  const created = chains.find(chain => chain.id === chainId);
  if (!created) {
    throw new Error("Approval chain could not be loaded after creation");
  }
  return created;
}

export async function updateApprovalChainTemplate(input: {
  id: number;
  name: string;
  description: string;
  escalationMode: "serial" | "parallel" | "auto_escalate";
  calendarProfile?: Partial<ApprovalChainCalendarProfileRecord>;
  stages: Array<{
    stageName: string;
    requiredRole: string;
    defaultApproverLabel: string;
    stageMode: "serial" | "parallel" | "branch";
    laneKey: string;
    branchSourceStageOrder?: number | null;
    branchLabel?: string;
    branchField?: BranchSignalKey;
    branchOperator: "always" | "equals" | "contains" | "greater_than" | "less_than";
    branchValue?: string;
    quorumMode?: ParallelQuorumMode;
    quorumTarget?: number;
    slaMinutes: number;
    escalationAfterMinutes: number;
    escalationTargetLabel: string;
  }>;
}) {
  const timestamp = Date.now();
  const db = await getDb();

  if (!db) {
    const index = approvalChainTemplatesData.findIndex(chain => chain.id === input.id);
    if (index === -1) {
      throw new Error("Approval chain not found");
    }
    approvalChainTemplatesData[index] = {
      id: input.id,
      name: input.name,
      description: input.description,
      escalationMode: input.escalationMode,
      calendarProfile: normalizeStoredCalendarProfile(input.calendarProfile),
      createdAt: approvalChainTemplatesData[index]!.createdAt,
      updatedAt: timestamp,
      stages: input.stages.map((stage, idx) => ({
        id: nextApprovalStageTemplateId++,
        stageOrder: idx + 1,
        stageName: stage.stageName,
        requiredRole: stage.requiredRole,
        defaultApproverLabel: stage.defaultApproverLabel,
        stageMode: stage.stageMode,
        laneKey: stage.laneKey,
        branchSourceStageOrder: stage.branchSourceStageOrder ?? null,
        branchLabel: stage.branchLabel ?? "",
        branchField: stage.branchField ?? "riskLevel",
        branchOperator: stage.branchOperator,
        branchValue: stage.branchValue ?? "",
        quorumMode: stage.quorumMode ?? "all",
        quorumTarget: stage.quorumTarget ?? 1,
        slaMinutes: stage.slaMinutes,
        escalationAfterMinutes: stage.escalationAfterMinutes,
        escalationTargetLabel: stage.escalationTargetLabel,
      })),
    };
    return cloneApprovalChainTemplate(approvalChainTemplatesData[index]!);
  }

  await ensureApprovalChainSeeded();
  const existing = await db.select().from(approvalChains).where(eq(approvalChains.id, input.id)).limit(1);
  if (existing.length === 0) {
    throw new Error("Approval chain not found");
  }

  await db.update(approvalChains).set({
    name: input.name,
    description: encodeApprovalChainDescription(input.description, normalizeStoredCalendarProfile(input.calendarProfile)),
    escalationMode: input.escalationMode,
    updatedAt: new Date(timestamp),
  }).where(eq(approvalChains.id, input.id));

  await db.delete(approvalStages).where(eq(approvalStages.chainId, input.id));

  const allStages = await db.select().from(approvalStages);
  let nextStageId = Math.max(0, ...allStages.map(stage => stage.id)) + 1;
  await db.insert(approvalStages).values(
    input.stages.map((stage, index) => ({
      id: nextStageId++,
      chainId: input.id,
      stageOrder: index + 1,
      stageName: stage.stageName,
      requiredRole: stage.requiredRole,
      defaultApproverLabel: stage.defaultApproverLabel,
      stageMode: stage.stageMode,
      laneKey: stage.laneKey,
      branchSourceStageOrder: stage.branchSourceStageOrder ?? null,
      branchLabel: stage.branchLabel ?? null,
      branchField: stage.branchField ?? "riskLevel",
      branchOperator: stage.branchOperator,
      branchValue: stage.branchValue ?? null,
      quorumMode: stage.quorumMode ?? "all",
      quorumTarget: stage.quorumTarget ?? 1,
      slaMinutes: stage.slaMinutes,
      escalationAfterMinutes: stage.escalationAfterMinutes,
      escalationTargetLabel: stage.escalationTargetLabel,
      createdAt: new Date(timestamp),
    })),
  );

  const chains = await listApprovalChains();
  const updated = chains.find(chain => chain.id === input.id);
  if (!updated) {
    throw new Error("Approval chain could not be loaded after update");
  }
  return updated;
}

export async function listApprovals() {
  synchronizeApprovalEscalations();
  return [...approvalsData].sort((a, b) => b.requestedAt - a.requestedAt);
}

export async function listApprovalNotifications() {
  return [...approvalNotificationsData].sort((a, b) => b.createdAt - a.createdAt);
}

export async function createApprovalNotification(input: {
  approvalId: number;
  approvalTitle: string;
  severity: RiskLevel | string;
  recipientRole: string;
  ownerLabel: string;
  escalationTarget?: string;
  actionType: "review" | "escalation" | "handover" | "resolution";
  channel?: "inbox" | "owner_notification";
}) {
  const notification: ApprovalNotificationRecord = {
    id: approvalNotificationsData.length + 1,
    approvalId: input.approvalId,
    approvalTitle: input.approvalTitle,
    severity: input.severity,
    recipientRole: input.recipientRole,
    ownerLabel: input.ownerLabel,
    escalationTarget: input.escalationTarget,
    actionType: input.actionType,
    channel: input.channel ?? "inbox",
    createdAt: Date.now(),
  };
  approvalNotificationsData.unshift(notification);
  return notification;
}

export async function applyApprovalChainToApproval(input: { approvalId: number; chainId: number; triggeredBy: string }) {
  const approval = approvalsData.find(item => item.id === input.approvalId);
  if (!approval) {
    throw new Error("Approval not found");
  }

  const chain = (await listApprovalChains()).find(item => item.id === input.chainId);
  if (!chain) {
    throw new Error("Approval chain not found");
  }

  approval.chainId = chain.id;
  approval.chainName = chain.name;
  approval.currentStageOrder = 1;
  approval.status = "pending";
  approval.escalationStatus = chain.escalationMode === "auto_escalate" ? "pending" : "none";
  approval.approver = undefined;
  approval.stages = chain.stages.map((stage, index) => ({
    id: stage.id,
    order: stage.stageOrder,
    name: stage.stageName,
    requiredRole: stage.requiredRole,
    ownerLabel: stage.defaultApproverLabel,
    status: index === 0 ? "pending" : "waiting",
    stageMode: stage.stageMode,
    laneKey: stage.laneKey,
    branchSourceStageOrder: stage.branchSourceStageOrder ?? null,
    branchLabel: stage.branchLabel ?? "",
    branchField: stage.branchField ?? "riskLevel",
    branchOperator: stage.branchOperator,
    branchValue: stage.branchValue ?? "",
    quorumMode: stage.quorumMode ?? "all",
    quorumTarget: stage.quorumTarget ?? 1,
    startedAt: index === 0 ? Date.now() : undefined,
    slaMinutes: stage.slaMinutes,
    escalationAfterMinutes: stage.escalationAfterMinutes,
    escalationTarget: stage.escalationTargetLabel,
  }));

  addAuditEvent({
    agentId: approval.agentId,
    agentName: approval.agentName,
    severity: "info",
    category: "Approval Workflow",
    title: "Genehmigungskette zugewiesen",
    detail: `Die gespeicherte Freigabekette \"${chain.name}\" wurde durch ${input.triggeredBy} auf \"${approval.title}\" angewendet.`,
    actorType: "user",
    actorRef: input.triggeredBy,
  });

  return approval;
}

export async function resolveApprovalStage(input: { approvalId: number; decision: "approved" | "rejected"; approver: string; note?: string }) {
  const sanitizedNote = input.note ? sanitizeTextForPrivacy(input.note).sanitizedText : undefined;
  const approval = approvalsData.find(item => item.id === input.approvalId);
  if (!approval) {
    throw new Error("Approval not found");
  }
  if (approval.status !== "pending") {
    throw new Error("Approval is already completed");
  }

  const stage = getCurrentApprovalStage(approval);
  if (!stage || (stage.status !== "pending" && stage.status !== "escalated")) {
    throw new Error("No actionable approval stage found");
  }

  stage.note = sanitizedNote;
  stage.resolvedAt = Date.now();

  if (input.decision === "rejected") {
    stage.status = "rejected";
    approval.status = "rejected";
    approval.approver = input.approver;
    approval.escalationStatus = "resolved";

    addAuditEvent({
      agentId: approval.agentId,
      agentName: approval.agentName,
      severity: "warning",
      category: "Approval Workflow",
      title: "Freigabekette abgelehnt",
      detail: `Die Stufe \"${stage.name}\" für \"${approval.title}\" wurde durch ${input.approver} abgelehnt.`,
      actorType: "user",
      actorRef: input.approver,
    });

    return approval;
  }

  stage.status = "approved";
  const parallelGroup = stage.stageMode === "parallel" ? getCurrentParallelGroup(approval) : [];
  const quorumState = parallelGroup.length > 0 ? getParallelQuorumConfig(parallelGroup) : null;
  const nextStages = getNextStagesAfterApproval(approval, stage);

  if (nextStages.length > 0) {
    if (parallelGroup.length > 0 && quorumState && hasParallelGroupReachedQuorum(parallelGroup)) {
      finalizeParallelGroupAfterQuorum(parallelGroup.filter(item => item.id !== stage.id), input.approver);
    }
    activateStages(nextStages);
    approval.currentStageOrder = Math.min(...nextStages.map(item => item.order));
    approval.escalationStatus = "pending";

    addAuditEvent({
      agentId: approval.agentId,
      agentName: approval.agentName,
      severity: "info",
      category: "Approval Workflow",
      title: nextStages.length > 1 ? "Parallele Freigabestufen aktiviert" : "Nächste Freigabestufe aktiviert",
      detail: nextStages.length > 1
        ? `Nach Freigabe durch ${input.approver} wurden ${nextStages.length} Folgepfade für "${approval.title}" aktiviert.`
        : `Nach Freigabe durch ${input.approver} wurde die Stufe "${nextStages[0]!.name}" für "${approval.title}" aktiviert.`,
      actorType: "user",
      actorRef: input.approver,
    });
  } else {
    const stillActiveStages = approval.stages
      .filter(item => item.status === "pending" || item.status === "escalated")
      .sort((a, b) => a.order - b.order);

    if (stillActiveStages.length > 0) {
      approval.status = "pending";
      approval.currentStageOrder = stillActiveStages[0]!.order;
      approval.escalationStatus = "pending";

      addAuditEvent({
        agentId: approval.agentId,
        agentName: approval.agentName,
        severity: "info",
        category: "Approval Workflow",
        title: "Parallele Freigabestufen laufen weiter",
        detail: quorumState
          ? `Nach Freigabe durch ${input.approver} bleibt das Sammel-Gate für "${approval.title}" offen, bis das Quorum ${quorumState.quorumMode} (${quorumState.quorumTarget}) erreicht ist.`
          : `Nach Freigabe durch ${input.approver} bleiben weitere aktive Parallelpfade für "${approval.title}" offen.`,
        actorType: "user",
        actorRef: input.approver,
      });
    } else {
      approval.status = "approved";
      approval.approver = input.approver;
      approval.escalationStatus = "resolved";

      addAuditEvent({
        agentId: approval.agentId,
        agentName: approval.agentName,
        severity: "info",
        category: "Approval Workflow",
        title: "Freigabekette abgeschlossen",
        detail: `Die Aktion "${approval.title}" wurde nach Abschluss aller Stufen durch ${input.approver} vollständig freigegeben.`,
        actorType: "user",
        actorRef: input.approver,
      });
    }
  }


  return approval;
}

export async function escalateApproval(input: { approvalId: number; triggeredBy: string; reason: string }) {
  const sanitizedReason = sanitizeTextForPrivacy(input.reason).sanitizedText;
  const approval = approvalsData.find(item => item.id === input.approvalId);
  if (!approval) {
    throw new Error("Approval not found");
  }
  if (approval.status !== "pending") {
    throw new Error("Approval is already completed");
  }

  const stage = getCurrentApprovalStage(approval);
  if (!stage || (stage.status !== "pending" && stage.status !== "escalated")) {
    throw new Error("No actionable approval stage found");
  }

  stage.status = "escalated";
  stage.ownerLabel = stage.escalationTarget;
  stage.escalationTriggeredAt = Date.now();
  stage.note = sanitizedReason;
  approval.escalationStatus = "escalated";

  addAuditEvent({
    agentId: approval.agentId,
    agentName: approval.agentName,
    severity: "warning",
    category: "Approval Workflow",
    title: "Freigabestufe manuell eskaliert",
    detail: `Die Stufe \"${stage.name}\" für \"${approval.title}\" wurde durch ${input.triggeredBy} an ${stage.ownerLabel} eskaliert.`,
    actorType: "user",
    actorRef: input.triggeredBy,
  });

  return approval;
}


export async function listAuditEvents() {
  return [...auditEventsData].sort((a, b) => b.createdAt - a.createdAt);
}

export async function listConnectors() {
  return [...connectorsData].sort((a, b) => a.name.localeCompare(b.name));
}

export async function listEvaluations() {
  return [...evaluationsData].sort((a, b) => b.executedAt - a.executedAt);
}

export async function listGuardrailEvents() {
  return [...guardrailsData].sort((a, b) => b.createdAt - a.createdAt);
}

export async function listMetricSnapshots() {
  refreshLiveMetrics();

  return [...metricsData]
    .sort((a, b) => a.agentName.localeCompare(b.agentName))
    .map(metric => ({
      ...metric,
      history: (metricHistoryData.get(metric.id) ?? []).map(point => ({
        window: point.window,
        capturedAt: point.capturedAt,
        latencyMs: point.latencyMs,
        errorRate: point.errorRate,
        apiCostUsd: point.apiCostUsd,
        tokenUsage: point.tokenUsage,
      })),
    }));
}

export async function createTeam(input: { name: string; owner: string; coverage: string }) {
  const team: TeamRecord = {
    id: nextTeamId++,
    name: input.name,
    members: 1,
    owner: input.owner,
    coverage: input.coverage,
  };
  teamsData.unshift(team);
  return team;
}

export async function createPermission(input: {
  subject: string;
  subjectType: "user" | "team";
  agentName: string;
  permissionLevel: "viewer" | "operator" | "approver" | "admin";
  toolScope: string;
}) {
  const permission: PermissionRecord = {
    id: nextPermissionId++,
    ...input,
  };
  permissionsData.unshift(permission);
  return permission;
}

export async function createEvaluationRun(input: { agentId: number; name: string; expectedOutcome: string }) {
  const privacyResult = sanitizeTextForPrivacy(input.expectedOutcome);
  const agent = agentsData.find(item => item.id === input.agentId);
  if (!agent) {
    throw new Error("Agent not found");
  }

  const status: EvaluationRecord["status"] = agent.riskLevel === "critical" ? "passed" : "passed";
  const score = agent.riskLevel === "critical" ? 92 : 96;
  const policyPassRate = agent.policyMode === "enforced" ? 98 : 91;

  const evaluation: EvaluationRecord = {
    id: nextEvaluationId++,
    agentId: agent.id,
    agentName: agent.name,
    name: input.name,
    status,
    score,
    policyPassRate,
    summary: `Pre-Deployment-Prüfung für ${agent.name}: ${privacyResult.sanitizedText}`,
    executedAt: Date.now(),
  };

  evaluationsData.unshift(evaluation);
  addAuditEvent({
    agentId: agent.id,
    agentName: agent.name,
    severity: "info",
    category: "Evaluation Layer",
    title: "Pre-Deployment-Evaluation gestartet",
    detail: privacyResult.containsSensitiveData
      ? `Die Testsuite "${input.name}" wurde für ${agent.name} ausgeführt. ${summarizePrivacySanitization(privacyResult)}`
      : `Die Testsuite "${input.name}" wurde für ${agent.name} ausgeführt.`,
    actorType: "user",
    actorRef: "evaluation-console",
  });

  return evaluation;
}

export async function createGuardrailEvent(input: { agentId: number; triggerType: string; thresholdLabel: string; detail: string }) {
  const sanitizedThreshold = sanitizeTextForPrivacy(input.thresholdLabel);
  const sanitizedDetail = sanitizeTextForPrivacy(input.detail);
  const combinedPrivacyResult = combinePrivacySanitizationResults(sanitizedThreshold, sanitizedDetail);
  const agent = agentsData.find(item => item.id === input.agentId);
  if (!agent) {
    throw new Error("Agent not found");
  }

  const event: GuardrailRecord = {
    id: nextGuardrailId++,
    agentId: agent.id,
    agentName: agent.name,
    triggerType: input.triggerType,
    status: "stopped",
    thresholdLabel: sanitizedThreshold.sanitizedText,
    detail: sanitizedDetail.sanitizedText,
    createdAt: Date.now(),
  };

  guardrailsData.unshift(event);
  agent.status = "paused";
  addAuditEvent({
    agentId: agent.id,
    agentName: agent.name,
    severity: "critical",
    category: "Runtime Guardrails",
    title: "Agent automatisch gestoppt",
    detail: combinedPrivacyResult.containsSensitiveData
      ? `${agent.name} wurde aufgrund des Triggers ${input.triggerType} automatisch pausiert. ${summarizePrivacySanitization(combinedPrivacyResult)}`
      : `${agent.name} wurde aufgrund des Triggers ${input.triggerType} automatisch pausiert.`,
    actorType: "system",
    actorRef: "guardrail-engine",
  });

  return event;
}

export async function getAccessOverview() {
  return {
    teams: teamsData,
    permissions: permissionsData,
  };
}

export async function listPrivacyRules() {
  return listCustomPrivacyRules();
}

export async function createPrivacyRule(input: PrivacyRuleInput) {
  return createCustomPrivacyRule(input);
}

export async function removePrivacyRule(input: { id: number }) {
  return deleteCustomPrivacyRule(input.id);
}

export async function listSwarmReportExports() {
  const db = await getDb();
  const swarms = await listAgentSwarms();
  return (await listSwarmReportState(db, swarms)).exports;
}

export async function listSwarmReportDownloadApprovals() {
  const db = await getDb();
  const swarms = await listAgentSwarms();
  return (await listSwarmReportState(db, swarms)).approvals;
}

export async function listSwarmReportSubscriptions() {
  const db = await getDb();
  const swarms = await listAgentSwarms();
  return (await listSwarmReportState(db, swarms)).subscriptions;
}

export async function requestSwarmReportDownload(input: {
  swarmId: number;
  format: "csv" | "pdf";
  reason: string;
  requestedByUserId: number | null;
  requestedByLabel: string;
  requestedBySystemRole: "user" | "admin";
}) {
  const db = await getDb();
  const swarms = await listAgentSwarms();
  return requestSwarmReportDownloadEntry({ db, swarms, ...input });
}

export async function resolveSwarmReportDownloadApproval(input: {
  approvalId: number;
  decision: "approved" | "rejected";
  resolvedByUserId: number | null;
  resolvedByLabel: string;
  resolvedBySystemRole: "user" | "admin";
}) {
  const db = await getDb();
  return resolveSwarmReportDownloadApprovalEntry({ db, ...input });
}

export async function createSwarmReportSubscription(input: {
  swarmId: number;
  cadence: "daily" | "weekly" | "monthly";
  format: "csv" | "pdf";
  recipientRoleLabel: string;
  createdByUserId: number | null;
  createdByLabel: string;
  startImmediately: boolean;
}) {
  const db = await getDb();
  const swarms = await listAgentSwarms();
  return createSwarmReportSubscriptionEntry({ db, swarms, ...input });
}

export async function runDueSwarmReportSubscriptions() {
  const db = await getDb();
  const swarms = await listAgentSwarms();
  await processDueSwarmReportSubscriptions(db, swarms);
  return listSwarmReportState(db, swarms);
}

async function getSwarmAutonomyContext(swarmId: number) {
  const swarms = await listAgentSwarms();
  const swarm = swarms.find(item => item.id === swarmId);
  if (!swarm) {
    throw new Error(`Agenten-Schwarm ${swarmId} wurde nicht gefunden.`);
  }

  const members = (await listAgents())
    .filter(agent => swarm.memberAgentIds.includes(agent.id))
    .map(agent => ({
      id: agent.id,
      name: agent.name,
      swarmRole: agent.swarmRole ?? null,
      tools: agent.tools,
      model: agent.model,
    }));

  return { swarm, members, swarms };
}

export async function listAutonomousSwarmRuns() {
  const swarms = await listAgentSwarms();
  return listSwarmAutonomyRuns(await getDb(), swarms.map(swarm => swarm.id));
}

export async function createAutonomousSwarmRun(input: {
  swarmId: number;
  objective: string;
  context?: string;
  priority?: SwarmAutonomyPriority;
  requestedByUserId: number | null;
  requestedByLabel: string;
  requestedByRole: "user" | "admin" | "system";
}) {
  const db = await getDb();
  const { swarm, members } = await getSwarmAutonomyContext(input.swarmId);
  return createSwarmAutonomyRunEntry({
    db,
    swarm,
    members,
    objective: input.objective,
    context: input.context,
    priority: input.priority,
    requestedByUserId: input.requestedByUserId,
    requestedByLabel: input.requestedByLabel,
    requestedByRole: input.requestedByRole,
  });
}

export async function controlAutonomousSwarmRun(input: {
  swarmId: number;
  runId: number;
  action: SwarmAutonomyAction;
  actorLabel: string;
  actorRole: "user" | "admin" | "system";
}) {
  const db = await getDb();
  const { swarm } = await getSwarmAutonomyContext(input.swarmId);
  return applySwarmAutonomyActionEntry({
    db,
    swarm,
    runId: input.runId,
    action: input.action,
    actorLabel: input.actorLabel,
    actorRole: input.actorRole,
  });
}

export async function getControlPlaneSnapshot() {
  const db = await getDb();
  const swarms = await listAgentSwarms();
  const reportState = await listSwarmReportState(db, swarms);
  const swarmAutonomyRuns = await listSwarmAutonomyRuns(db, swarms.map(swarm => swarm.id));
  return {
    dashboard: await getDashboardOverview(),
    agents: await listAgents(),
    agentSwarms: swarms,
    swarmReportExports: reportState.exports,
    swarmReportDownloadApprovals: reportState.approvals,
    swarmReportSubscriptions: reportState.subscriptions,
    swarmAutonomyRuns,
    policies: await listPolicies(),
    approvalChains: await listApprovalChains(),
    approvals: await listApprovals(),
    approvalNotifications: await listApprovalNotifications(),
    auditEvents: await listAuditEvents(),
    connectors: await listConnectors(),
    evaluations: await listEvaluations(),
    guardrails: await listGuardrailEvents(),
    metrics: await listMetricSnapshots(),
    access: await getAccessOverview(),
    privacyProtection: getPrivacyProtectionSummary(),
    privacyRules: await listPrivacyRules(),
  };
}
