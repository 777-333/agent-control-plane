import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
    } as TrpcContext["res"],
  };
}

describe("control plane router", () => {
  it("returns a populated snapshot for the dashboard shell", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const snapshot = await caller.controlPlane.snapshot();

    expect(snapshot.dashboard.stats.activeAgents).toBeGreaterThan(0);
    expect(snapshot.agents.length).toBeGreaterThan(0);
    expect(snapshot.policies.length).toBeGreaterThan(0);
    expect(snapshot.approvals.length).toBeGreaterThan(0);
    expect(snapshot.auditEvents.length).toBeGreaterThan(0);
    expect(snapshot.metrics.length).toBeGreaterThan(0);
  });

  it("creates a new agent through the protected mutation", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const created = await caller.agents.create({
      name: "Compliance Sentinel",
      description: "Überwacht regulatorische Agentenaktionen in einer kontrollierten Testumgebung.",
      team: "Governance",
      owner: "Sample User",
      model: "gpt-4.1",
      environment: "staging",
    });

    expect(created.name).toBe("Compliance Sentinel");
    expect(created.environment).toBe("staging");

    const agents = await caller.agents.list();
    expect(agents.some(agent => agent.name === "Compliance Sentinel")).toBe(true);
  });

  it("advances a multistage approval to the next stage instead of closing the workflow immediately", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const approvalsBefore = await caller.approvals.list();
    const multistage = approvalsBefore.find(item => item.id === 2);

    expect(multistage).toBeDefined();
    expect(multistage?.currentStageOrder).toBe(1);

    const resolved = await caller.approvals.resolve({
      approvalId: 2,
      decision: "approved",
      note: "Lead approval completed.",
    });

    expect(resolved.status).toBe("pending");
    expect(resolved.currentStageOrder).toBe(2);
    expect(resolved.stages[0]?.status).toBe("approved");
    expect(resolved.stages[1]?.status).toBe("pending");

    const approvalsAfter = await caller.approvals.list();
    const updated = approvalsAfter.find(item => item.id === 2);
    expect(updated?.currentStageOrder).toBe(2);
  });

  it("escalates the current approval stage to the configured fallback owner", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const escalated = await caller.approvals.escalate({
      approvalId: 1,
      reason: "SLA überschritten – Eskalation an Executive Risk Committee.",
    });

    expect(escalated.escalationStatus).toBe("escalated");
    expect(escalated.stages[1]?.status).toBe("escalated");
    expect(escalated.stages[1]?.ownerLabel).toBe("Executive Risk Committee");
  });

  it("creates teams and permissions for Rollen- und Rechteverwaltung", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const team = await caller.access.createTeam({
      name: "Security Office",
      owner: "Sample User",
      coverage: "Policies, Guardrails",
    });

    expect(team.name).toBe("Security Office");

    const permission = await caller.access.createPermission({
      subject: "Security Office",
      subjectType: "team",
      agentName: "Finance Sentinel",
      permissionLevel: "approver",
      toolScope: "ERP",
    });

    expect(permission.permissionLevel).toBe("approver");

    const overview = await caller.access.overview();
    expect(overview.teams.some(item => item.name === "Security Office")).toBe(true);
    expect(overview.permissions.some(item => item.subject === "Security Office")).toBe(true);
  });

  it("runs a pre-deployment evaluation and creates a new evaluation record", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const evaluation = await caller.evaluations.run({
      agentId: 1,
      name: "Policy regression suite",
      expectedOutcome: "Alle kritischen ERP-Aktionen werden als approval_required markiert.",
    });

    expect(evaluation.agentName).toBe("Finance Sentinel");
    expect(evaluation.name).toBe("Policy regression suite");

    const evaluations = await caller.evaluations.list();
    expect(evaluations.some(item => item.name === "Policy regression suite")).toBe(true);
  });

  it("triggers a guardrail and pauses the affected agent", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const event = await caller.guardrails.trigger({
      agentId: 2,
      triggerType: "cost_threshold",
      thresholdLabel: "Daily budget > 120 USD",
      detail: "Support Orchestrator exceeded the approved spend envelope.",
    });

    expect(event.status).toBe("stopped");

    const snapshot = await caller.controlPlane.snapshot();
    const affectedAgent = snapshot.agents.find(agent => agent.id === 2);
    expect(affectedAgent?.status).toBe("paused");
    expect(snapshot.guardrails.some(item => item.thresholdLabel === "Daily budget > 120 USD")).toBe(true);
  });
});
