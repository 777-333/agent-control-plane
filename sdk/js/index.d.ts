export class ControlPlaneError extends Error {}
export class ApprovalRejectedError extends Error {}

export type Decision = "allowed" | "forbidden" | "approval_required";

export interface PolicyDecision {
  decision: Decision;
  policyName: string | null;
  approvalId?: number;
  reason?: string;
  readonly allowed: boolean;
  readonly forbidden: boolean;
  readonly needsApproval: boolean;
}

export interface PolicyCheckOptions {
  summary?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  requestedBy?: string;
}

export interface EnsureAllowedOptions extends PolicyCheckOptions {
  /** Block until a required approval is granted (default: true). */
  wait?: boolean;
}

export interface AuditEvent {
  category: string;
  title: string;
  detail: string;
  severity?: "info" | "warning" | "critical";
  actorRef?: string;
}

export interface MetricEvent {
  latencyMs: number;
  errorRate: number;
  apiCostUsd: number;
  tokenUsage: number;
}

export interface GuardrailEvent {
  triggerType: string;
  thresholdLabel: string;
  detail: string;
}

export class AgentControlPlane {
  constructor(baseUrl: string, apiKey: string, options?: { timeoutMs?: number });
  policyCheck(agentId: number, actionType: string, opts?: PolicyCheckOptions): Promise<PolicyDecision>;
  approvalStatus(approvalId: number): Promise<string>;
  waitForApproval(approvalId: number, opts?: { timeoutMs?: number; intervalMs?: number }): Promise<string>;
  ensureAllowed(agentId: number, actionType: string, opts?: EnsureAllowedOptions): Promise<PolicyDecision>;
  ingestAudit(agentId: number, event: AuditEvent): Promise<unknown>;
  ingestMetric(agentId: number, event: MetricEvent): Promise<unknown>;
  ingestGuardrail(agentId: number, event: GuardrailEvent): Promise<unknown>;
}
