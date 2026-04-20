import {
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  description: text("description"),
  status: mysqlEnum("status", ["healthy", "warning", "paused", "offline"]).default("healthy").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  ownerUserId: int("ownerUserId"),
  teamId: int("teamId"),
  model: varchar("model", { length: 160 }).notNull(),
  environment: mysqlEnum("environment", ["production", "staging", "development"]).default("production").notNull(),
  policyMode: mysqlEnum("policyMode", ["enforced", "monitoring", "disabled"]).default("enforced").notNull(),
  lastHeartbeatAt: timestamp("lastHeartbeatAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const connectors = mysqlTable("connectors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  type: mysqlEnum("type", ["CRM", "ERP", "E-Mail", "Browser", "Datenbank"]).notNull(),
  status: mysqlEnum("status", ["connected", "degraded", "disconnected"]).default("connected").notNull(),
  endpointLabel: varchar("endpointLabel", { length: 160 }).notNull(),
  authMode: varchar("authMode", { length: 64 }).notNull(),
  lastSyncAt: timestamp("lastSyncAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const agentConnectors = mysqlTable("agentConnectors", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  connectorId: int("connectorId").notNull(),
  permissionScope: varchar("permissionScope", { length: 120 }).notNull(),
  mode: mysqlEnum("mode", ["read", "write", "approve"]).default("read").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const policies = mysqlTable("policies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  scopeType: mysqlEnum("scopeType", ["agent", "team", "connector", "global"]).default("agent").notNull(),
  scopeRef: varchar("scopeRef", { length: 140 }).notNull(),
  actionPattern: varchar("actionPattern", { length: 180 }).notNull(),
  effect: mysqlEnum("effect", ["allowed", "forbidden", "approval_required"]).notNull(),
  priority: int("priority").default(100).notNull(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const teamMemberships = mysqlTable("teamMemberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  teamId: int("teamId").notNull(),
  roleLabel: varchar("roleLabel", { length: 80 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const agentPermissions = mysqlTable("agentPermissions", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  subjectType: mysqlEnum("subjectType", ["user", "team"]).notNull(),
  subjectRef: varchar("subjectRef", { length: 80 }).notNull(),
  permissionLevel: mysqlEnum("permissionLevel", ["viewer", "operator", "approver", "admin"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const agentActions = mysqlTable("agentActions", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  connectorId: int("connectorId"),
  actionType: varchar("actionType", { length: 140 }).notNull(),
  status: mysqlEnum("status", ["executed", "blocked", "pending_approval", "failed"]).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  estimatedCostUsd: decimal("estimatedCostUsd", { precision: 10, scale: 2 }).default("0.00").notNull(),
  tokenUsage: int("tokenUsage").default(0).notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const approvalChains = mysqlTable("approvalChains", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  escalationMode: mysqlEnum("escalationMode", ["serial", "parallel", "auto_escalate"]).default("serial").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const approvalStages = mysqlTable("approvalStages", {
  id: int("id").autoincrement().primaryKey(),
  chainId: int("chainId").notNull(),
  stageOrder: int("stageOrder").notNull(),
  stageName: varchar("stageName", { length: 140 }).notNull(),
  requiredRole: varchar("requiredRole", { length: 100 }).notNull(),
  defaultApproverLabel: varchar("defaultApproverLabel", { length: 160 }).notNull(),
  stageMode: mysqlEnum("stageMode", ["serial", "parallel", "branch"]).default("serial").notNull(),
  laneKey: varchar("laneKey", { length: 80 }).default("main").notNull(),
  branchSourceStageOrder: int("branchSourceStageOrder"),
  branchLabel: varchar("branchLabel", { length: 120 }),
  branchOperator: mysqlEnum("branchOperator", ["always", "equals", "contains", "greater_than", "less_than"]).default("always").notNull(),
  branchValue: varchar("branchValue", { length: 160 }),
  slaMinutes: int("slaMinutes").default(60).notNull(),
  escalationAfterMinutes: int("escalationAfterMinutes").default(120).notNull(),
  escalationTargetLabel: varchar("escalationTargetLabel", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  actionId: int("actionId").notNull(),
  chainId: int("chainId"),
  currentStageOrder: int("currentStageOrder").default(1).notNull(),
  escalationStatus: mysqlEnum("escalationStatus", ["none", "pending", "escalated", "resolved"]).default("none").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "expired"]).default("pending").notNull(),
  requestedByUserId: int("requestedByUserId"),
  approverUserId: int("approverUserId"),
  summary: text("summary").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export const auditEvents = mysqlTable("auditEvents", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId"),
  actionId: int("actionId"),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  detail: text("detail").notNull(),
  actorType: mysqlEnum("actorType", ["agent", "user", "system"]).default("system").notNull(),
  actorRef: varchar("actorRef", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["draft", "running", "passed", "failed"]).default("draft").notNull(),
  score: int("score").default(0).notNull(),
  policyPassRate: int("policyPassRate").default(0).notNull(),
  summary: text("summary").notNull(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export const evaluationCases = mysqlTable("evaluationCases", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  expectedOutcome: text("expectedOutcome").notNull(),
  actualOutcome: text("actualOutcome").notNull(),
  status: mysqlEnum("status", ["passed", "failed", "warning"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const guardrailEvents = mysqlTable("guardrailEvents", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  actionId: int("actionId"),
  triggerType: mysqlEnum("triggerType", ["policy_violation", "cost_threshold", "tool_anomaly", "latency_spike"]).notNull(),
  status: mysqlEnum("status", ["monitoring", "stopped", "resolved"]).default("monitoring").notNull(),
  thresholdLabel: varchar("thresholdLabel", { length: 160 }).notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const metricSnapshots = mysqlTable("metricSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId"),
  latencyMs: int("latencyMs").default(0).notNull(),
  errorRate: decimal("errorRate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  apiCostUsd: decimal("apiCostUsd", { precision: 10, scale: 2 }).default("0.00").notNull(),
  tokenUsage: int("tokenUsage").default(0).notNull(),
  windowLabel: varchar("windowLabel", { length: 40 }).notNull(),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
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
