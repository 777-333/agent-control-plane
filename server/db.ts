import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

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

type ApprovalStageRecord = {
  id: number;
  order: number;
  name: string;
  requiredRole: string;
  ownerLabel: string;
  status: ApprovalStageStatus;
  startedAt?: number;
  resolvedAt?: number;
  slaMinutes: number;
  escalationAfterMinutes: number;
  escalationTarget: string;
  escalationTriggeredAt?: number;
  note?: string;
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
let nextPolicyId = 4;
let nextTeamId = 4;
let nextPermissionId = 5;
let nextEvaluationId = 4;
let nextGuardrailId = 4;

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
    successRate: 99.1,
    tools: ["ERP", "E-Mail", "Datenbank"],
  },
  {
    id: 2,
    name: "Support Orchestrator",
    description: "Klassifiziert Support-Fälle, formuliert Antworten und steuert Eskalationen in CRM- und Mail-Flows.",
    status: "warning",
    riskLevel: "high",
    team: "Customer Success",
    owner: "Mara Vogt",
    model: "claude-3.7-sonnet",
    environment: "production",
    policyMode: "enforced",
    lastHeartbeat: now - 1000 * 60 * 11,
    monthlyCostUsd: 3150,
    tokenUsage: 1290000,
    successRate: 96.4,
    tools: ["CRM", "E-Mail", "Browser"],
  },
  {
    id: 3,
    name: "Research Navigator",
    description: "Erstellt strukturierte Recherchen, sammelt Nachweise und nutzt Browser- sowie Wissens-Connectoren.",
    status: "healthy",
    riskLevel: "medium",
    team: "Strategy Office",
    owner: "David Brandt",
    model: "gemini-2.5-pro",
    environment: "staging",
    policyMode: "monitoring",
    lastHeartbeat: now - 1000 * 60 * 4,
    monthlyCostUsd: 1240,
    tokenUsage: 610000,
    successRate: 98.2,
    tools: ["Browser", "Datenbank"],
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

const metricsData: MetricRecord[] = [
  { id: 1, agentId: 1, agentName: "Finance Sentinel", latencyMs: 1620, errorRate: 0.7, apiCostUsd: 4820, tokenUsage: 1840000, windowLabel: "30d", capturedAt: now - 1000 * 60 * 3 },
  { id: 2, agentId: 2, agentName: "Support Orchestrator", latencyMs: 3940, errorRate: 3.8, apiCostUsd: 3150, tokenUsage: 1290000, windowLabel: "30d", capturedAt: now - 1000 * 60 * 4 },
  { id: 3, agentId: 3, agentName: "Research Navigator", latencyMs: 1280, errorRate: 0.4, apiCostUsd: 1240, tokenUsage: 610000, windowLabel: "30d", capturedAt: now - 1000 * 60 * 5 },
];

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

function getCurrentApprovalStage(approval: ApprovalRecord) {
  return approval.stages.find(stage => stage.order === approval.currentStageOrder);
}

function addAuditEvent(event: Omit<AuditEventRecord, "id" | "createdAt"> & { createdAt?: number }) {
  auditEventsData.unshift({
    id: auditEventsData.length + 1,
    createdAt: event.createdAt ?? Date.now(),
    ...event,
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

export async function createAgent(input: {
  name: string;
  description: string;
  team: string;
  owner: string;
  model: string;
  environment: string;
}) {
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

export async function listApprovals() {
  synchronizeApprovalEscalations();
  return [...approvalsData].sort((a, b) => b.requestedAt - a.requestedAt);
}

export async function resolveApprovalStage(input: { approvalId: number; decision: "approved" | "rejected"; approver: string; note?: string }) {
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

  stage.note = input.note;
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
  const nextStage = approval.stages.find(item => item.order === stage.order + 1);

  if (nextStage) {
    nextStage.status = "pending";
    nextStage.startedAt = Date.now();
    approval.currentStageOrder = nextStage.order;
    approval.escalationStatus = "pending";

    addAuditEvent({
      agentId: approval.agentId,
      agentName: approval.agentName,
      severity: "info",
      category: "Approval Workflow",
      title: "Nächste Freigabestufe aktiviert",
      detail: `Nach Freigabe durch ${input.approver} wurde die Stufe \"${nextStage.name}\" für \"${approval.title}\" aktiviert.`,
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
      detail: `Die Aktion \"${approval.title}\" wurde nach Abschluss aller Stufen durch ${input.approver} vollständig freigegeben.`,
      actorType: "user",
      actorRef: input.approver,
    });
  }

  return approval;
}

export async function escalateApproval(input: { approvalId: number; triggeredBy: string; reason: string }) {
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
  stage.note = input.reason;
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
  return [...metricsData].sort((a, b) => a.agentName.localeCompare(b.agentName));
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
    summary: `Pre-Deployment-Prüfung für ${agent.name}: ${input.expectedOutcome}`,
    executedAt: Date.now(),
  };

  evaluationsData.unshift(evaluation);
  addAuditEvent({
    agentId: agent.id,
    agentName: agent.name,
    severity: "info",
    category: "Evaluation Layer",
    title: "Pre-Deployment-Evaluation gestartet",
    detail: `Die Testsuite \"${input.name}\" wurde für ${agent.name} ausgeführt.`,
    actorType: "user",
    actorRef: "evaluation-console",
  });

  return evaluation;
}

export async function createGuardrailEvent(input: { agentId: number; triggerType: string; thresholdLabel: string; detail: string }) {
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
    thresholdLabel: input.thresholdLabel,
    detail: input.detail,
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
    detail: `${agent.name} wurde aufgrund des Triggers ${input.triggerType} automatisch pausiert.`,
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

export async function getControlPlaneSnapshot() {
  return {
    dashboard: await getDashboardOverview(),
    agents: await listAgents(),
    policies: await listPolicies(),
    approvals: await listApprovals(),
    auditEvents: await listAuditEvents(),
    connectors: await listConnectors(),
    evaluations: await listEvaluations(),
    guardrails: await listGuardrailEvents(),
    metrics: await listMetricSnapshots(),
    access: await getAccessOverview(),
  };
}
