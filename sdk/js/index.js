// Agent Control Plane – JavaScript/TypeScript SDK
//
// Connect a Node.js agent runtime to the Agent Control Plane: ask before
// acting (policy check), wait for human approval, and report events back.
// Dependency-free: uses the global fetch (Node 18+).

export class ControlPlaneError extends Error {}
export class ApprovalRejectedError extends Error {}

export class AgentControlPlane {
  /**
   * @param {string} baseUrl  e.g. "https://acc.3333.tools"
   * @param {string} apiKey   your "acp_..." API key
   * @param {{ timeoutMs?: number }} [options]
   */
  constructor(baseUrl, apiKey, options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  async _request(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new ControlPlaneError(`HTTP ${response.status}`);
    }
    if (!response.ok || data.ok === false) {
      throw new ControlPlaneError(data.error || `HTTP ${response.status}`);
    }
    return data;
  }

  /** Ask whether an action is allowed. */
  async policyCheck(agentId, actionType, opts = {}) {
    const data = await this._request("POST", "/api/policy-check", {
      agentId,
      actionType,
      summary: opts.summary,
      riskLevel: opts.riskLevel,
      requestedBy: opts.requestedBy,
    });
    return {
      decision: data.decision,
      policyName: data.policyName ?? null,
      approvalId: data.approvalId,
      reason: data.reason,
      get allowed() { return this.decision === "allowed"; },
      get forbidden() { return this.decision === "forbidden"; },
      get needsApproval() { return this.decision === "approval_required"; },
    };
  }

  /** Current status of an approval (pending/approved/rejected/expired). */
  async approvalStatus(approvalId) {
    const data = await this._request("GET", `/api/approval-status/${approvalId}`);
    return data.status;
  }

  /** Poll until a human resolves the approval. Resolves on "approved". */
  async waitForApproval(approvalId, { timeoutMs = 300000, intervalMs = 5000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const status = await this.approvalStatus(approvalId);
      if (status === "approved") return status;
      if (status === "rejected" || status === "expired") {
        throw new ApprovalRejectedError(`Approval ${approvalId} ${status}`);
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw new ControlPlaneError(`Approval ${approvalId} not resolved within ${timeoutMs}ms`);
  }

  /**
   * policyCheck + (optionally) block until a required approval clears.
   * Throws on forbidden / rejected.
   */
  async ensureAllowed(agentId, actionType, opts = {}) {
    const { wait = true, ...rest } = opts;
    const decision = await this.policyCheck(agentId, actionType, rest);
    if (decision.forbidden) {
      throw new ControlPlaneError(decision.reason || "Action forbidden by policy");
    }
    if (decision.needsApproval && wait) {
      await this.waitForApproval(decision.approvalId);
    }
    return decision;
  }

  ingestAudit(agentId, { category, title, detail, severity = "info", actorRef = "agent" }) {
    return this._request("POST", "/api/ingest", {
      type: "audit",
      payload: { agentId, category, title, detail, severity, actorRef },
    });
  }

  ingestMetric(agentId, { latencyMs, errorRate, apiCostUsd, tokenUsage }) {
    return this._request("POST", "/api/ingest", {
      type: "metric",
      payload: { agentId, latencyMs, errorRate, apiCostUsd, tokenUsage },
    });
  }

  ingestGuardrail(agentId, { triggerType, thresholdLabel, detail }) {
    return this._request("POST", "/api/ingest", {
      type: "guardrail",
      payload: { agentId, triggerType, thresholdLabel, detail },
    });
  }
}
