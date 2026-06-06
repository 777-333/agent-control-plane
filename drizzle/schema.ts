import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Core relational schema (Postgres / Supabase).
 *
 * Auth-critical data (`users`) and the entities that were already persisted
 * relationally live here. The remaining, deeply-nested business collections are
 * persisted via the JSONB write-through store in `appCollections` (see
 * server/db/persistence.ts).
 *
 * Columns use camelCase to match both database fields and generated types.
 */

const ts = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

// --- Enums -----------------------------------------------------------------
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const agentStatusEnum = pgEnum("agent_status", ["healthy", "warning", "paused", "offline"]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high", "critical"]);
export const environmentEnum = pgEnum("environment", ["production", "staging", "development"]);
export const policyModeEnum = pgEnum("policy_mode", ["enforced", "monitoring", "disabled"]);
export const connectorTypeEnum = pgEnum("connector_type", ["CRM", "ERP", "E-Mail", "Browser", "Datenbank"]);
export const connectorStatusEnum = pgEnum("connector_status", ["connected", "degraded", "disconnected"]);
export const agentConnectorModeEnum = pgEnum("agent_connector_mode", ["read", "write", "approve"]);
export const policyScopeTypeEnum = pgEnum("policy_scope_type", ["agent", "team", "connector", "global"]);
export const policyEffectEnum = pgEnum("policy_effect", ["allowed", "forbidden", "approval_required"]);
export const boolishEnum = pgEnum("boolish", ["true", "false"]);
export const subjectTypeEnum = pgEnum("subject_type", ["user", "team"]);
export const permissionLevelEnum = pgEnum("permission_level", ["viewer", "operator", "approver", "admin"]);
export const actionStatusEnum = pgEnum("action_status", ["executed", "blocked", "pending_approval", "failed"]);
export const escalationModeEnum = pgEnum("escalation_mode", ["serial", "parallel", "auto_escalate"]);
export const stageModeEnum = pgEnum("stage_mode", ["serial", "parallel", "branch"]);
export const branchFieldEnum = pgEnum("branch_field", ["riskLevel", "requestedBy", "agentName", "title", "summary", "chainName", "escalationStatus"]);
export const branchOperatorEnum = pgEnum("branch_operator", ["always", "equals", "contains", "greater_than", "less_than"]);
export const quorumModeEnum = pgEnum("quorum_mode", ["all", "majority", "minimum_count", "distinct_roles"]);
export const approvalEscalationStatusEnum = pgEnum("approval_escalation_status", ["none", "pending", "escalated", "resolved"]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected", "expired"]);
export const severityEnum = pgEnum("severity", ["info", "warning", "critical"]);
export const actorTypeEnum = pgEnum("actor_type", ["agent", "user", "system"]);
export const evaluationStatusEnum = pgEnum("evaluation_status", ["draft", "running", "passed", "failed"]);
export const evaluationCaseStatusEnum = pgEnum("evaluation_case_status", ["passed", "failed", "warning"]);
export const guardrailTriggerEnum = pgEnum("guardrail_trigger", ["policy_violation", "cost_threshold", "tool_anomaly", "latency_spike"]);
export const guardrailStatusEnum = pgEnum("guardrail_status", ["monitoring", "stopped", "resolved"]);
export const swarmMessageKindEnum = pgEnum("swarm_message_kind", ["directive", "status", "evidence", "approval"]);
export const reportFormatEnum = pgEnum("report_format", ["csv", "pdf"]);
export const triggerSourceEnum = pgEnum("trigger_source", ["manual", "approval", "subscription"]);
export const systemRoleEnum = pgEnum("system_role", ["user", "admin", "system"]);
export const downloadRequestStatusEnum = pgEnum("download_request_status", ["pending", "approved", "rejected", "consumed"]);
export const cadenceEnum = pgEnum("cadence", ["daily", "weekly", "monthly"]);
export const autonomyPriorityEnum = pgEnum("autonomy_priority", ["standard", "urgent", "critical"]);
export const autonomyRunStatusEnum = pgEnum("autonomy_run_status", ["planned", "running", "awaiting_approval", "blocked", "paused", "completed", "cancelled", "failed"]);
export const governanceStatusEnum = pgEnum("governance_status", ["clear", "approval_required", "blocked"]);
export const autonomyStepStatusEnum = pgEnum("autonomy_step_status", ["pending", "in_progress", "completed", "blocked", "awaiting_input", "skipped", "cancelled"]);
export const autonomyEventTypeEnum = pgEnum("autonomy_event_type", ["planned", "delegated", "feedback", "governance", "paused", "resumed", "cancelled", "completed", "failed"]);

/**
 * Core user table backing auth flow.
 * `openId` stores the Supabase Auth user UUID.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
  updatedAt: ts("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignedIn: ts("lastSignedIn").defaultNow().notNull(),
});

/**
 * Generic JSONB write-through store. One row per in-memory collection
 * (e.g. "agents", "policies", "approvals"). `data` holds the full collection.
 */
export const appCollections = pgTable("appCollections", {
  key: varchar("key", { length: 80 }).primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: ts("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  createdAt: ts("createdAt").defaultNow().notNull(),
  updatedAt: ts("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  description: text("description"),
  status: agentStatusEnum("status").default("healthy").notNull(),
  riskLevel: riskLevelEnum("riskLevel").default("medium").notNull(),
  ownerUserId: integer("ownerUserId"),
  teamId: integer("teamId"),
  model: varchar("model", { length: 160 }).notNull(),
  environment: environmentEnum("environment").default("production").notNull(),
  policyMode: policyModeEnum("policyMode").default("enforced").notNull(),
  lastHeartbeatAt: ts("lastHeartbeatAt").defaultNow().notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
  updatedAt: ts("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const connectors = pgTable("connectors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  type: connectorTypeEnum("type").notNull(),
  status: connectorStatusEnum("status").default("connected").notNull(),
  endpointLabel: varchar("endpointLabel", { length: 160 }).notNull(),
  authMode: varchar("authMode", { length: 64 }).notNull(),
  lastSyncAt: ts("lastSyncAt").defaultNow().notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export const agentConnectors = pgTable("agentConnectors", {
  id: serial("id").primaryKey(),
  agentId: integer("agentId").notNull(),
  connectorId: integer("connectorId").notNull(),
  permissionScope: varchar("permissionScope", { length: 120 }).notNull(),
  mode: agentConnectorModeEnum("mode").default("read").notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  scopeType: policyScopeTypeEnum("scopeType").default("agent").notNull(),
  scopeRef: varchar("scopeRef", { length: 140 }).notNull(),
  actionPattern: varchar("actionPattern", { length: 180 }).notNull(),
  effect: policyEffectEnum("effect").notNull(),
  priority: integer("priority").default(100).notNull(),
  isActive: boolishEnum("isActive").default("true").notNull(),
  description: text("description"),
  createdAt: ts("createdAt").defaultNow().notNull(),
  updatedAt: ts("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const teamMemberships = pgTable("teamMemberships", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  teamId: integer("teamId").notNull(),
  roleLabel: varchar("roleLabel", { length: 80 }).notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export const agentPermissions = pgTable("agentPermissions", {
  id: serial("id").primaryKey(),
  agentId: integer("agentId").notNull(),
  subjectType: subjectTypeEnum("subjectType").notNull(),
  subjectRef: varchar("subjectRef", { length: 80 }).notNull(),
  permissionLevel: permissionLevelEnum("permissionLevel").notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export const agentActions = pgTable("agentActions", {
  id: serial("id").primaryKey(),
  agentId: integer("agentId").notNull(),
  connectorId: integer("connectorId"),
  actionType: varchar("actionType", { length: 140 }).notNull(),
  status: actionStatusEnum("status").notNull(),
  riskLevel: riskLevelEnum("riskLevel").default("medium").notNull(),
  estimatedCostUsd: numeric("estimatedCostUsd", { precision: 10, scale: 2 }).default("0.00").notNull(),
  tokenUsage: integer("tokenUsage").default(0).notNull(),
  summary: text("summary").notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export const approvalChains = pgTable("approvalChains", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  escalationMode: escalationModeEnum("escalationMode").default("serial").notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
  updatedAt: ts("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const approvalStages = pgTable("approvalStages", {
  id: serial("id").primaryKey(),
  chainId: integer("chainId").notNull(),
  stageOrder: integer("stageOrder").notNull(),
  stageName: varchar("stageName", { length: 140 }).notNull(),
  requiredRole: varchar("requiredRole", { length: 100 }).notNull(),
  defaultApproverLabel: varchar("defaultApproverLabel", { length: 160 }).notNull(),
  stageMode: stageModeEnum("stageMode").default("serial").notNull(),
  laneKey: varchar("laneKey", { length: 80 }).default("main").notNull(),
  branchSourceStageOrder: integer("branchSourceStageOrder"),
  branchLabel: varchar("branchLabel", { length: 120 }),
  branchField: branchFieldEnum("branchField").default("riskLevel").notNull(),
  branchOperator: branchOperatorEnum("branchOperator").default("always").notNull(),
  branchValue: varchar("branchValue", { length: 160 }),
  quorumMode: quorumModeEnum("quorumMode").default("all").notNull(),
  quorumTarget: integer("quorumTarget").default(1).notNull(),
  slaMinutes: integer("slaMinutes").default(60).notNull(),
  escalationAfterMinutes: integer("escalationAfterMinutes").default(120).notNull(),
  escalationTargetLabel: varchar("escalationTargetLabel", { length: 160 }).notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),
  agentId: integer("agentId").notNull(),
  actionId: integer("actionId").notNull(),
  chainId: integer("chainId"),
  currentStageOrder: integer("currentStageOrder").default(1).notNull(),
  escalationStatus: approvalEscalationStatusEnum("escalationStatus").default("none").notNull(),
  status: approvalStatusEnum("status").default("pending").notNull(),
  requestedByUserId: integer("requestedByUserId"),
  approverUserId: integer("approverUserId"),
  summary: text("summary").notNull(),
  requestedAt: ts("requestedAt").defaultNow().notNull(),
  resolvedAt: ts("resolvedAt"),
});

export const auditEvents = pgTable("auditEvents", {
  id: serial("id").primaryKey(),
  agentId: integer("agentId"),
  actionId: integer("actionId"),
  severity: severityEnum("severity").default("info").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  detail: text("detail").notNull(),
  actorType: actorTypeEnum("actorType").default("system").notNull(),
  actorRef: varchar("actorRef", { length: 120 }).notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  agentId: integer("agentId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  status: evaluationStatusEnum("status").default("draft").notNull(),
  score: integer("score").default(0).notNull(),
  policyPassRate: integer("policyPassRate").default(0).notNull(),
  summary: text("summary").notNull(),
  executedAt: ts("executedAt").defaultNow().notNull(),
});

export const evaluationCases = pgTable("evaluationCases", {
  id: serial("id").primaryKey(),
  evaluationId: integer("evaluationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  expectedOutcome: text("expectedOutcome").notNull(),
  actualOutcome: text("actualOutcome").notNull(),
  status: evaluationCaseStatusEnum("status").notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export const guardrailEvents = pgTable("guardrailEvents", {
  id: serial("id").primaryKey(),
  agentId: integer("agentId").notNull(),
  actionId: integer("actionId"),
  triggerType: guardrailTriggerEnum("triggerType").notNull(),
  status: guardrailStatusEnum("status").default("monitoring").notNull(),
  thresholdLabel: varchar("thresholdLabel", { length: 160 }).notNull(),
  detail: text("detail").notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export const metricSnapshots = pgTable("metricSnapshots", {
  id: serial("id").primaryKey(),
  agentId: integer("agentId"),
  latencyMs: integer("latencyMs").default(0).notNull(),
  errorRate: numeric("errorRate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  apiCostUsd: numeric("apiCostUsd", { precision: 10, scale: 2 }).default("0.00").notNull(),
  tokenUsage: integer("tokenUsage").default(0).notNull(),
  windowLabel: varchar("windowLabel", { length: 40 }).notNull(),
  capturedAt: ts("capturedAt").defaultNow().notNull(),
});

export const swarmMessages = pgTable("swarmMessages", {
  id: serial("id").primaryKey(),
  swarmId: integer("swarmId").notNull(),
  communicationLinkId: integer("communicationLinkId").notNull(),
  senderAgentId: integer("senderAgentId").notNull(),
  senderAgentName: varchar("senderAgentName", { length: 160 }).notNull(),
  content: text("content").notNull(),
  kind: swarmMessageKindEnum("kind").notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export const swarmReportExports = pgTable("swarmReportExports", {
  id: serial("id").primaryKey(),
  swarmId: integer("swarmId").notNull(),
  format: reportFormatEnum("format").notNull(),
  triggerSource: triggerSourceEnum("triggerSource").default("manual").notNull(),
  triggeredByUserId: integer("triggeredByUserId"),
  triggeredByLabel: varchar("triggeredByLabel", { length: 160 }).notNull(),
  requesterRole: systemRoleEnum("requesterRole").default("user").notNull(),
  reportWindowHours: integer("reportWindowHours").default(24).notNull(),
  communicationLinkCount: integer("communicationLinkCount").default(0).notNull(),
  approvalMessageCount: integer("approvalMessageCount").default(0).notNull(),
  overdueLinkCount: integer("overdueLinkCount").default(0).notNull(),
  averageResponseMinutes: integer("averageResponseMinutes").default(0).notNull(),
  metadata: text("metadata"),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export const swarmReportDownloadApprovals = pgTable("swarmReportDownloadApprovals", {
  id: serial("id").primaryKey(),
  swarmId: integer("swarmId").notNull(),
  format: reportFormatEnum("format").notNull(),
  requestStatus: downloadRequestStatusEnum("requestStatus").default("pending").notNull(),
  requiredRoleLabel: varchar("requiredRoleLabel", { length: 160 }).notNull(),
  requestedByUserId: integer("requestedByUserId"),
  requestedByLabel: varchar("requestedByLabel", { length: 160 }).notNull(),
  requestedBySystemRole: userRoleEnum("requestedBySystemRole").default("user").notNull(),
  approvedByUserId: integer("approvedByUserId"),
  approvedByLabel: varchar("approvedByLabel", { length: 160 }),
  reason: text("reason").notNull(),
  exportWindowHours: integer("exportWindowHours").default(24).notNull(),
  sensitivityLabel: varchar("sensitivityLabel", { length: 180 }).notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
  resolvedAt: ts("resolvedAt"),
  consumedAt: ts("consumedAt"),
});

export const swarmReportSubscriptions = pgTable("swarmReportSubscriptions", {
  id: serial("id").primaryKey(),
  swarmId: integer("swarmId").notNull(),
  cadence: cadenceEnum("cadence").notNull(),
  format: reportFormatEnum("format").notNull(),
  recipientRoleLabel: varchar("recipientRoleLabel", { length: 160 }).notNull(),
  createdByUserId: integer("createdByUserId"),
  createdByLabel: varchar("createdByLabel", { length: 160 }).notNull(),
  isActive: boolishEnum("isActive").default("true").notNull(),
  startImmediately: boolishEnum("startImmediately").default("false").notNull(),
  nextRunAt: ts("nextRunAt").notNull(),
  lastRunAt: ts("lastRunAt"),
  createdAt: ts("createdAt").defaultNow().notNull(),
  updatedAt: ts("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const swarmAutonomyRuns = pgTable("swarmAutonomyRuns", {
  id: serial("id").primaryKey(),
  swarmId: integer("swarmId").notNull(),
  objective: text("objective").notNull(),
  context: text("context"),
  priority: autonomyPriorityEnum("priority").default("standard").notNull(),
  status: autonomyRunStatusEnum("status").default("planned").notNull(),
  governanceStatus: governanceStatusEnum("governanceStatus").default("clear").notNull(),
  requestedByUserId: integer("requestedByUserId"),
  requestedByLabel: varchar("requestedByLabel", { length: 160 }).notNull(),
  requestedByRole: systemRoleEnum("requestedByRole").default("user").notNull(),
  summary: text("summary").notNull(),
  startedAt: ts("startedAt"),
  completedAt: ts("completedAt"),
  lastEventAt: ts("lastEventAt").defaultNow().notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
  updatedAt: ts("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const swarmAutonomySteps = pgTable("swarmAutonomySteps", {
  id: serial("id").primaryKey(),
  runId: integer("runId").notNull(),
  swarmId: integer("swarmId").notNull(),
  assignedAgentId: integer("assignedAgentId").notNull(),
  assignedAgentName: varchar("assignedAgentName", { length: 160 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  instructions: text("instructions").notNull(),
  status: autonomyStepStatusEnum("status").default("pending").notNull(),
  sequence: integer("sequence").notNull(),
  dependsOnStepId: integer("dependsOnStepId"),
  output: text("output"),
  createdAt: ts("createdAt").defaultNow().notNull(),
  updatedAt: ts("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  completedAt: ts("completedAt"),
});

export const swarmAutonomyEvents = pgTable("swarmAutonomyEvents", {
  id: serial("id").primaryKey(),
  runId: integer("runId").notNull(),
  swarmId: integer("swarmId").notNull(),
  stepId: integer("stepId"),
  eventType: autonomyEventTypeEnum("eventType").notNull(),
  actorLabel: varchar("actorLabel", { length: 160 }).notNull(),
  detail: text("detail").notNull(),
  createdAt: ts("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Policy = typeof policies.$inferSelect;
export type ApprovalChain = typeof approvalChains.$inferSelect;
export type ApprovalStage = typeof approvalStages.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type Connector = typeof connectors.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type GuardrailEvent = typeof guardrailEvents.$inferSelect;
export type MetricSnapshot = typeof metricSnapshots.$inferSelect;
export type SwarmMessage = typeof swarmMessages.$inferSelect;
export type SwarmReportExport = typeof swarmReportExports.$inferSelect;
export type SwarmReportDownloadApproval = typeof swarmReportDownloadApprovals.$inferSelect;
export type SwarmReportSubscription = typeof swarmReportSubscriptions.$inferSelect;
export type SwarmAutonomyRun = typeof swarmAutonomyRuns.$inferSelect;
export type SwarmAutonomyStep = typeof swarmAutonomySteps.$inferSelect;
export type SwarmAutonomyEvent = typeof swarmAutonomyEvents.$inferSelect;
