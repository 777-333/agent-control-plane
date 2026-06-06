import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { swarmMessages, swarmReportSubscriptions } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { resetCustomPrivacyRules } from "./privacy";
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
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
    ...overrides,
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
  beforeEach(() => {
    resetCustomPrivacyRules();
  });

  it("returns a populated snapshot for the dashboard shell", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const snapshot = await caller.controlPlane.snapshot();

    expect(snapshot.dashboard.stats.activeAgents).toBeGreaterThan(0);
    expect(snapshot.agents.length).toBeGreaterThan(0);
    expect(snapshot.policies.length).toBeGreaterThan(0);
    expect(snapshot.approvals.length).toBeGreaterThan(0);
    expect(snapshot.approvalNotifications.length).toBeGreaterThan(0);
    expect(snapshot.auditEvents.length).toBeGreaterThan(0);
    expect(snapshot.metrics.length).toBeGreaterThan(0);
    expect(snapshot.metrics[0]?.history).toHaveLength(6);
    expect(snapshot.metrics[0]?.history[0]?.window).toMatch(/^T-/);
    expect(snapshot.metrics[0]?.history[5]).toMatchObject({ window: "Jetzt" });
  });

  it("returns privacy protection metadata in the snapshot", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const snapshot = await caller.controlPlane.snapshot();

    expect(snapshot.privacyProtection.enabled).toBe(true);
    expect(snapshot.privacyProtection.mode).toBe("pseudonymization_before_ai");
    expect(snapshot.privacyProtection.coverageModel).toBe("global_heuristic_patterns");
    expect(snapshot.privacyProtection.configurable).toBe(true);
    expect(snapshot.privacyProtection.supportedCategories.some(item => item.category === "iban")).toBe(true);
  });

  it("creates, updates and duplicates agents through the protected mutations", async () => {
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

    const updated = await caller.agents.update({
      id: created.id,
      name: "Compliance Sentinel Prime",
      description: "Überwacht regulatorische Agentenaktionen mit erweitertem Eskalations- und Auditfokus.",
      team: "Governance",
      owner: "Sample User",
      model: "gpt-4.1",
      environment: "production",
    });

    expect(updated.name).toBe("Compliance Sentinel Prime");
    expect(updated.environment).toBe("production");

    const duplicate = await caller.agents.duplicate({
      sourceAgentId: updated.id,
      name: `${updated.name} Kopie`,
      description: updated.description,
      team: updated.team,
      owner: updated.owner,
      model: updated.model,
      environment: "production",
    });

    expect(duplicate.id).not.toBe(updated.id);
    expect(duplicate.name).toBe("Compliance Sentinel Prime Kopie");

    const agents = await caller.agents.list();
    expect(agents.some(agent => agent.name === "Compliance Sentinel Prime")).toBe(true);
    expect(agents.some(agent => agent.name === "Compliance Sentinel Prime Kopie")).toBe(true);
  });

  it("creates an agent swarm with coordinated members and communication links", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const swarm = await caller.agents.createSwarm({
      name: "Revenue Recovery Swarm",
      mission: "Koordiniert Analyse, Kundenansprache und Maßnahmenplanung für offene Revenue-Risiken.",
      topology: "hub_spoke",
      coordinationMode: "supervisor",
      team: "Revenue Operations",
      owner: "Sample User",
      environment: "staging",
      governance: {
        policyMode: "approval_required",
        approvalRequired: true,
        approverRole: "revenue_approver",
        escalationTarget: "VP Revenue Operations",
        slaMinutes: 15,
        escalationAfterMinutes: 30,
        reportingWindowHours: 12,
      },
      members: [
        {
          name: "Recovery Lead",
          role: "supervisor",
          description: "Priorisiert Revenue-Fälle, verteilt Aufgaben und bündelt Entscheidungen.",
          model: "gpt-4.1",
          tools: ["CRM", "Analytics"],
        },
        {
          name: "Customer Liaison",
          role: "communicator",
          description: "Bereitet kundennahe Maßnahmen und Kommunikationsentwürfe vor.",
          model: "gpt-4.1-mini",
          tools: ["E-Mail", "CRM"],
        },
      ],
    });

    expect(swarm.name).toBe("Revenue Recovery Swarm");
    expect(swarm.members).toHaveLength(2);
    expect(swarm.communicationLinks.length).toBeGreaterThan(0);
    expect(swarm.governance.policyMode).toBe("approval_required");
    expect(swarm.members.every(member => member.swarmId === swarm.id)).toBe(true);
    expect(swarm.members.map(member => member.swarmRole)).toEqual(["supervisor", "communicator"]);

    const snapshot = await caller.controlPlane.snapshot();
    const createdSwarm = snapshot.agentSwarms.find(item => item.id === swarm.id);
    expect(createdSwarm?.memberAgentIds).toHaveLength(2);
    expect(createdSwarm?.governance.approverRole).toBe("revenue_approver");
    expect(createdSwarm?.communicationLinks[0]?.fromAgentName).toBeTruthy();
    expect(createdSwarm?.communicationLinks[0]?.history.length).toBeGreaterThan(0);
  });

  it("records swarm messages on a communication path and rejects invalid senders", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const snapshot = await caller.controlPlane.snapshot();
    const seededSwarm = snapshot.agentSwarms[0]!;
    const seededLink = seededSwarm.communicationLinks[0]!;
    const previousLastMessageAt = seededLink.lastMessageAt;

    const updatedLink = await caller.agents.postSwarmMessage({
      swarmId: seededSwarm.id,
      communicationLinkId: seededLink.id,
      senderAgentId: seededLink.fromAgentId,
      content: "Aktualisierte Incident-Zusammenfassung mit Freigabekontext an den Zielagenten übermittelt.",
      kind: "status",
    });

    expect(updatedLink.history.at(-1)?.content).toContain("Aktualisierte Incident-Zusammenfassung");
    expect(updatedLink.lastMessageAt).toBeGreaterThanOrEqual(previousLastMessageAt);

    await expect(caller.agents.postSwarmMessage({
      swarmId: seededSwarm.id,
      communicationLinkId: seededLink.id,
      senderAgentId: seededLink.toAgentId,
      content: "Unzulässiger Sender versucht den Kanal zu verwenden.",
      kind: "status",
    })).rejects.toThrow("Quellagenten");
  });

  it.skipIf(!process.env.DATABASE_URL)("persists swarm messages through the database and exposes them again in the snapshot", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const snapshot = await caller.controlPlane.snapshot();
    const seededSwarm = snapshot.agentSwarms[0]!;
    const seededLink = seededSwarm.communicationLinks[0]!;
    const content = `Persistenztest ${Date.now()}`;

    await caller.agents.postSwarmMessage({
      swarmId: seededSwarm.id,
      communicationLinkId: seededLink.id,
      senderAgentId: seededLink.fromAgentId,
      content,
      kind: "status",
    });

    const db = await getDb();
    expect(db).toBeTruthy();

    if (!db) {
      return;
    }

    const persistedRows = await db
      .select()
      .from(swarmMessages)
      .where(eq(swarmMessages.swarmId, seededSwarm.id));

    expect(
      persistedRows.some(
        row =>
          row.communicationLinkId === seededLink.id &&
          row.senderAgentId === seededLink.fromAgentId &&
          row.content === content &&
          row.kind === "status",
      ),
    ).toBe(true);

    const refreshedSnapshot = await caller.controlPlane.snapshot();
    const refreshedLink = refreshedSnapshot.agentSwarms
      .find(item => item.id === seededSwarm.id)
      ?.communicationLinks.find(item => item.id === seededLink.id);

    expect(refreshedLink?.history.some(message => message.content === content && message.kind === "status")).toBe(true);
  });

  it("enforces swarm governance for sensitive communication paths", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const snapshot = await caller.controlPlane.snapshot();
    const seededSwarm = snapshot.agentSwarms[0]!;
    const seededLink = seededSwarm.communicationLinks[0]!;

    await expect(caller.agents.postSwarmMessage({
      swarmId: seededSwarm.id,
      communicationLinkId: seededLink.id,
      senderAgentId: seededLink.fromAgentId,
      content: "Deploy production payment workflow without additional review.",
      kind: "directive",
    })).rejects.toThrow("Freigabe der Rolle");

    const approvedLink = await caller.agents.postSwarmMessage({
      swarmId: seededSwarm.id,
      communicationLinkId: seededLink.id,
      senderAgentId: seededLink.fromAgentId,
      content: "Approved: deploy production payment workflow after finance review.",
      kind: "approval",
    });

    expect(approvedLink.history.at(-1)?.kind).toBe("approval");

    const enforcedSwarm = await caller.agents.createSwarm({
      name: "Prod Enforcement Swarm",
      mission: "Überwacht produktionsnahe Aktionen und blockiert unzulässige Ausführungen über eine harte Governance.",
      topology: "pipeline",
      coordinationMode: "planner_executor",
      team: "Platform Operations",
      owner: "Sample User",
      environment: "production",
      governance: {
        policyMode: "enforced",
        approvalRequired: true,
        approverRole: "platform_approver",
        escalationTarget: "Chief Platform Officer",
        slaMinutes: 10,
        escalationAfterMinutes: 20,
        reportingWindowHours: 24,
      },
      members: [
        {
          name: "Planner",
          role: "planner",
          description: "Plant produktionsnahe Änderungen und verteilt Arbeitspakete entlang der Pipeline.",
          model: "gpt-4.1",
          tools: ["Runbooks", "Policy Registry"],
        },
        {
          name: "Executor",
          role: "executor",
          description: "Führt freigegebene Maßnahmen aus und dokumentiert Rückmeldungen entlang der Pipeline.",
          model: "gpt-4.1-mini",
          tools: ["Deploy Console", "Audit Log"],
        },
      ],
    });

    await expect(caller.agents.postSwarmMessage({
      swarmId: enforcedSwarm.id,
      communicationLinkId: enforcedSwarm.communicationLinks[0]!.id,
      senderAgentId: enforcedSwarm.communicationLinks[0]!.fromAgentId,
      content: "Approved: deploy production changes immediately.",
      kind: "approval",
    })).rejects.toThrow("Durchsetzungsmodus");
  });

  it("creates custom privacy rules and exposes them through snapshot metadata", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const createdRule = await caller.privacyRules.create({
      name: "Mandantenreferenz",
      kind: "contextual",
      category: "personal_identifier",
      keywords: ["mandanten-id", "client reference"],
    });

    expect(createdRule.name).toBe("Mandantenreferenz");

    const snapshot = await caller.controlPlane.snapshot();
    expect(snapshot.privacyProtection.customRuleCount).toBe(1);
    expect(snapshot.privacyRules[0]?.name).toBe("Mandantenreferenz");

    const evaluation = await caller.evaluations.run({
      agentId: 1,
      name: "Manual rule regression",
      expectedOutcome: "Mandanten-ID: C-7788-44 darf nicht roh an die KI gehen.",
    });

    expect(evaluation.summary).toContain("[PERSON_ID_1]");

    await caller.privacyRules.remove({ id: createdRule.id });
    const rulesAfterRemoval = await caller.privacyRules.list();
    expect(rulesAfterRemoval).toHaveLength(0);
  });

  it("pseudonymizes sensitive identifiers before evaluation and guardrail storage", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const evaluation = await caller.evaluations.run({
      agentId: 1,
      name: "Privacy regression",
      expectedOutcome: "Bitte prüfe IBAN DE89370400440532013000 und Steuer-ID 12/345/67890 für max.mustermann@example.de.",
    });

    expect(evaluation.summary).toContain("[IBAN_1]");
    expect(evaluation.summary).toContain("[TAX_ID_1]");
    expect(evaluation.summary).toContain("[EMAIL_1]");
    expect(evaluation.summary).not.toContain("DE89370400440532013000");

    const guardrail = await caller.guardrails.trigger({
      agentId: 1,
      triggerType: "policy_violation",
      thresholdLabel: "IBAN DE89370400440532013000 erkannt",
      detail: "Krankenversicherung: AOK99887766 und Personalausweis ABC1234567 müssen redigiert werden.",
    });

    expect(guardrail.thresholdLabel).toContain("[IBAN_1]");
    expect(guardrail.detail).toContain("[HEALTH_INSURANCE_1]");
    expect(guardrail.detail).toContain("[PERSON_ID_1]");
    expect(guardrail.detail).not.toContain("ABC1234567");

    const auditEvents = await caller.audit.list();
    const privacyAudit = auditEvents.find(item => item.detail.includes("pseudonymisiert"));
    expect(privacyAudit).toBeDefined();
    expect(privacyAudit?.detail).not.toContain("DE89370400440532013000");
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

  it("sends role-based approval notifications with the extended payload", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const result = await caller.approvals.notify({
      approvalTitle: "Kulanzgutschrift für Enterprise-Kunde · CS Lead Approval",
      severity: "high",
      recipientRole: "approver",
      ownerLabel: "Customer Success Lead",
      escalationTarget: "VP Customer Success",
      actionType: "review",
    });

    expect(result).toEqual({ delivered: expect.any(Boolean) });
  });

  it("creates and updates a custom approval chain via the persistent editor endpoints", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const created = await caller.approvals.createChain({
      name: "Security incident escalation chain",
      description: "Dreistufige Freigabekette für kritische Sicherheitsmaßnahmen mit Eskalation an das Incident Board.",
      escalationMode: "auto_escalate",
      calendarProfile: {
        presetId: "security-operations-high",
        businessDayStartHour: 6,
        businessDayEndHour: 20,
        workingDays: [1, 2, 3, 4, 5, 6],
        holidayDates: ["2026-01-01", "2026-12-25"],
      },
      stages: [
        {
          stageName: "SOC Triage",
          requiredRole: "approver",
          defaultApproverLabel: "SOC Lead",
          stageMode: "serial",
          laneKey: "main",
          branchSourceStageOrder: null,
          branchLabel: "",
          branchField: "riskLevel",
          branchOperator: "always",
          branchValue: "",
          quorumMode: "all",
          quorumTarget: 1,
          slaMinutes: 20,
          escalationAfterMinutes: 30,
          escalationTargetLabel: "Head of Security Operations",
        },
        {
          stageName: "Incident Commander Approval",
          requiredRole: "admin",
          defaultApproverLabel: "Incident Commander",
          stageMode: "parallel",
          laneKey: "parallel-a",
          branchSourceStageOrder: null,
          branchLabel: "",
          branchField: "riskLevel",
          branchOperator: "always",
          branchValue: "",
          slaMinutes: 30,
          escalationAfterMinutes: 45,
          escalationTargetLabel: "Security Steering Committee",
        },
      ],
    });

    expect(created.name).toBe("Security incident escalation chain");
    expect(created.stages).toHaveLength(2);
    expect(created.calendarProfile).toMatchObject({
      presetId: "security-operations-high",
      businessDayStartHour: 6,
      businessDayEndHour: 20,
      workingDays: [1, 2, 3, 4, 5, 6],
    });

    const updated = await caller.approvals.updateChain({
      id: created.id,
      name: "Security incident escalation chain",
      description: "Aktualisierte Freigabekette für kritische Sicherheitsmaßnahmen mit Executive Escalation.",
      escalationMode: "parallel",
      calendarProfile: {
        presetId: "executive-board-high",
        businessDayStartHour: 8,
        businessDayEndHour: 19,
        workingDays: [1, 2, 3, 4, 5],
        holidayDates: ["2026-01-01", "2026-05-01", "2026-12-25"],
      },
      stages: [
        {
          stageName: "SOC Triage",
          requiredRole: "approver",
          defaultApproverLabel: "SOC Lead",
          stageMode: "serial",
          laneKey: "main",
          branchSourceStageOrder: null,
          branchLabel: "",
          branchField: "riskLevel",
          branchOperator: "always",
          branchValue: "",
          quorumMode: "all",
          quorumTarget: 1,
          slaMinutes: 20,
          escalationAfterMinutes: 25,
          escalationTargetLabel: "Head of Security Operations",
        },
        {
          stageName: "Executive Approval",
          requiredRole: "admin",
          defaultApproverLabel: "CISO Office",
          stageMode: "branch",
          laneKey: "branch-a",
          branchSourceStageOrder: 1,
          branchLabel: "Nur bei Sicherheitsvorfall",
          branchField: "title",
          branchOperator: "contains",
          branchValue: "Security",
          quorumMode: "all",
          quorumTarget: 1,
          slaMinutes: 30,
          escalationAfterMinutes: 40,
          escalationTargetLabel: "Executive Risk Committee",
        },
      ],
    });

    expect(updated.escalationMode).toBe("parallel");
    expect(updated.stages[1]?.stageName).toBe("Executive Approval");
    expect(updated.stages[1]?.branchField).toBe("title");
    expect(updated.calendarProfile).toMatchObject({
      presetId: "executive-board-high",
      businessDayStartHour: 8,
      businessDayEndHour: 19,
      holidayDates: ["2026-01-01", "2026-05-01", "2026-12-25"],
    });

    const chains = await caller.approvals.chains();
    const persisted = chains.find(item => item.id === created.id);
    expect(persisted).toBeDefined();
    expect(persisted?.escalationMode).toBe("parallel");
    expect(persisted?.calendarProfile).toMatchObject({
      presetId: "executive-board-high",
      businessDayStartHour: 8,
      businessDayEndHour: 19,
    });

    const assigned = await caller.approvals.assignChain({
      approvalId: 2,
      chainId: created.id,
    });

    expect(assigned.chainId).toBe(created.id);
    expect(assigned.chainName).toBe("Security incident escalation chain");
    expect(assigned.currentStageOrder).toBe(1);
    expect(assigned.stages[0]?.name).toBe("SOC Triage");
  });

  it("applies stored parallel and branching configuration to a real approval workflow", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const created = await caller.approvals.createChain({
      name: "Parallel risk review chain",
      description: "Kombiniert sequenzielle, parallele und bedingte Stufen für Hochrisiko-Aktionen.",
      escalationMode: "parallel",
      stages: [
        {
          stageName: "Primary Review",
          requiredRole: "approver",
          defaultApproverLabel: "Ops Lead",
          stageMode: "serial",
          laneKey: "main",
          branchSourceStageOrder: null,
          branchLabel: "",
          branchField: "riskLevel",
          branchOperator: "always",
          branchValue: "",
          slaMinutes: 15,
          escalationAfterMinutes: 20,
          escalationTargetLabel: "Ops Director",
        },
        {
          stageName: "Finance Parallel Review",
          requiredRole: "approver",
          defaultApproverLabel: "Finance Lead",
          stageMode: "parallel",
          laneKey: "parallel-a",
          branchSourceStageOrder: null,
          branchLabel: "",
          branchField: "riskLevel",
          branchOperator: "always",
          branchValue: "",
          quorumMode: "all",
          quorumTarget: 1,
          slaMinutes: 20,
          escalationAfterMinutes: 30,
          escalationTargetLabel: "Finance Director",
        },
        {
          stageName: "Security Parallel Review",
          requiredRole: "admin",
          defaultApproverLabel: "Security Lead",
          stageMode: "parallel",
          laneKey: "parallel-b",
          branchSourceStageOrder: null,
          branchLabel: "",
          branchField: "riskLevel",
          branchOperator: "always",
          branchValue: "",
          quorumMode: "all",
          quorumTarget: 1,
          slaMinutes: 20,
          escalationAfterMinutes: 30,
          escalationTargetLabel: "CISO",
        },
        {
          stageName: "Executive Branch Review",
          requiredRole: "admin",
          defaultApproverLabel: "Executive Risk Committee",
          stageMode: "branch",
          laneKey: "branch-a",
          branchSourceStageOrder: 3,
          branchLabel: "High risk only",
          branchField: "riskLevel",
          branchOperator: "equals",
          branchValue: "critical",
          quorumMode: "all",
          quorumTarget: 1,
          slaMinutes: 25,
          escalationAfterMinutes: 35,
          escalationTargetLabel: "CEO Office",
        },
      ],
    });

    const assigned = await caller.approvals.assignChain({ approvalId: 1, chainId: created.id });
    expect(assigned.stages.map(stage => stage.status)).toEqual(["pending", "waiting", "waiting", "waiting"]);

    const afterPrimary = await caller.approvals.resolve({
      approvalId: 1,
      decision: "approved",
      note: "routine",
    });

    expect(afterPrimary.status).toBe("pending");
    expect(afterPrimary.stages[1]?.status).toBe("pending");
    expect(afterPrimary.stages[2]?.status).toBe("pending");

    const afterParallelA = await caller.approvals.resolve({
      approvalId: 1,
      decision: "approved",
      note: "parallel finance review done",
    });
    expect(afterParallelA.status).toBe("pending");
    expect(afterParallelA.stages[2]?.status).toBe("pending");
    expect(afterParallelA.stages[3]?.status).toBe("waiting");

    const afterParallelB = await caller.approvals.resolve({
      approvalId: 1,
      decision: "approved",
      note: "parallel security review done",
    });
    expect(afterParallelB.status).toBe("pending");
    expect(afterParallelB.stages[3]?.status).toBe("pending");

    const afterBranch = await caller.approvals.resolve({
      approvalId: 1,
      decision: "approved",
      note: "executive branch cleared",
    });
    expect(afterBranch.status).toBe("approved");
    expect(afterBranch.stages.every(stage => stage.status === "approved")).toBe(true);
  });

  it("supports majority quorum for parallel Sammel-Gates", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const created = await caller.approvals.createChain({
      name: "Majority quorum chain",
      description: "Parallelgate mit Mehrheitsregel für sensible Freigaben.",
      escalationMode: "parallel",
      stages: [
        {
          stageName: "Initial Review",
          requiredRole: "approver",
          defaultApproverLabel: "Ops Lead",
          stageMode: "serial",
          laneKey: "main",
          branchSourceStageOrder: null,
          branchLabel: "",
          branchField: "riskLevel",
          branchOperator: "always",
          branchValue: "",
          quorumMode: "all",
          quorumTarget: 1,
          slaMinutes: 15,
          escalationAfterMinutes: 20,
          escalationTargetLabel: "Ops Director",
        },
        {
          stageName: "Finance Vote",
          requiredRole: "approver",
          defaultApproverLabel: "Finance Lead",
          stageMode: "parallel",
          laneKey: "parallel-a",
          branchSourceStageOrder: null,
          branchLabel: "",
          branchField: "riskLevel",
          branchOperator: "always",
          branchValue: "",
          quorumMode: "majority",
          quorumTarget: 2,
          slaMinutes: 15,
          escalationAfterMinutes: 20,
          escalationTargetLabel: "Finance Director",
        },
        {
          stageName: "Security Vote",
          requiredRole: "admin",
          defaultApproverLabel: "Security Lead",
          stageMode: "parallel",
          laneKey: "parallel-b",
          branchSourceStageOrder: null,
          branchLabel: "",
          branchField: "riskLevel",
          branchOperator: "always",
          branchValue: "",
          quorumMode: "majority",
          quorumTarget: 2,
          slaMinutes: 15,
          escalationAfterMinutes: 20,
          escalationTargetLabel: "CISO",
        },
        {
          stageName: "Compliance Vote",
          requiredRole: "user",
          defaultApproverLabel: "Compliance Lead",
          stageMode: "parallel",
          laneKey: "parallel-b",
          branchSourceStageOrder: null,
          branchLabel: "",
          branchField: "riskLevel",
          branchOperator: "always",
          branchValue: "",
          quorumMode: "majority",
          quorumTarget: 2,
          slaMinutes: 15,
          escalationAfterMinutes: 20,
          escalationTargetLabel: "Chief Compliance Officer",
        },
        {
          stageName: "Final Approval",
          requiredRole: "admin",
          defaultApproverLabel: "Executive Desk",
          stageMode: "serial",
          laneKey: "main",
          branchSourceStageOrder: null,
          branchLabel: "",
          branchField: "riskLevel",
          branchOperator: "always",
          branchValue: "",
          quorumMode: "all",
          quorumTarget: 1,
          slaMinutes: 15,
          escalationAfterMinutes: 20,
          escalationTargetLabel: "CEO Office",
        },
      ],
    });

    await caller.approvals.assignChain({ approvalId: 2, chainId: created.id });
    await caller.approvals.resolve({ approvalId: 2, decision: "approved", note: "initial cleared" });

    const afterFirstParallelVote = await caller.approvals.resolve({ approvalId: 2, decision: "approved", note: "finance yes" });
    expect(afterFirstParallelVote.currentStageOrder).toBe(3);
    expect(afterFirstParallelVote.stages[2]?.status).toBe("pending");
    expect(afterFirstParallelVote.stages[3]?.status).toBe("pending");
    expect(afterFirstParallelVote.stages[4]?.status).toBe("waiting");

    const afterSecondParallelVote = await caller.approvals.resolve({ approvalId: 2, decision: "approved", note: "security yes" });
    expect(afterSecondParallelVote.currentStageOrder).toBe(5);
    expect(afterSecondParallelVote.stages[3]?.status).toBe("approved");
    expect(afterSecondParallelVote.stages[4]?.status).toBe("pending");

    const finalResolution = await caller.approvals.resolve({ approvalId: 2, decision: "approved", note: "final cleared" });
    expect(finalResolution.status).toBe("approved");
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

  it("includes server-side swarm export history, approval requests and subscriptions in the control-plane snapshot", async () => {
    const adminCaller = appRouter.createCaller(createAuthContext({ name: "Ops Console", email: "ops@example.com", role: "admin" }));
    const userCaller = appRouter.createCaller(createAuthContext({ id: 6, name: "Snapshot Analyst", email: "snapshot@example.com", role: "user", openId: "snapshot-user" }));
    const swarm = (await adminCaller.controlPlane.snapshot()).agentSwarms[0]!;

    await userCaller.swarmReports.requestDownload({
      swarmId: swarm.id,
      format: "csv",
      reason: "Snapshot-Verifikation für sensible Governance-Daten.",
    });

    await adminCaller.swarmReports.createSubscription({
      swarmId: swarm.id,
      cadence: "daily",
      format: "pdf",
      recipientRoleLabel: "Head of Operations",
      startImmediately: true,
    });

    const snapshot = await adminCaller.controlPlane.snapshot();

    expect(snapshot.swarmReportExports.length).toBeGreaterThan(0);
    expect(snapshot.swarmReportDownloadApprovals.length).toBeGreaterThan(0);
    expect(snapshot.swarmReportSubscriptions.length).toBeGreaterThan(0);
    expect(snapshot.swarmReportExports.some(item => item.swarmId === swarm.id)).toBe(true);
    expect(snapshot.swarmReportDownloadApprovals.some(item => item.swarmId === swarm.id && item.requestStatus === "pending")).toBe(true);
    expect(snapshot.swarmReportSubscriptions.some(item => item.swarmId === swarm.id && item.cadence === "daily")).toBe(true);
  });

  it("requires admin approval for sensitive swarm report downloads and records the export after release", async () => {
    const adminCaller = appRouter.createCaller(createAuthContext({ name: "Ops Console", email: "ops@example.com", role: "admin" }));
    const userCaller = appRouter.createCaller(createAuthContext({ id: 5, name: "Analyst User", email: "analyst@example.com", role: "user", openId: "analyst-user" }));
    const swarm = (await adminCaller.controlPlane.snapshot()).agentSwarms[0]!;

    const requested = await userCaller.swarmReports.requestDownload({
      swarmId: swarm.id,
      format: "pdf",
      reason: "Monatliches Governance-Review für den Incident-Swarm.",
    });

    expect(requested.status).toBe("pending");
    expect(requested.approval?.requestStatus).toBe("pending");

    const resolved = await adminCaller.swarmReports.resolveDownloadApproval({
      approvalId: requested.approval!.id,
      decision: "approved",
    });
    expect(resolved.requestStatus).toBe("approved");

    const approvedDownload = await userCaller.swarmReports.requestDownload({
      swarmId: swarm.id,
      format: "pdf",
      reason: "Monatliches Governance-Review für den Incident-Swarm.",
    });

    expect(approvedDownload.status).toBe("approved");
    expect(approvedDownload.exportEntry?.format).toBe("pdf");

    const snapshot = await adminCaller.controlPlane.snapshot();
    expect(snapshot.swarmReportExports.some(item => item.id === approvedDownload.exportEntry?.id)).toBe(true);
  });

  it("creates immediate governance-report subscriptions and materializes a subscription export in history", async () => {
    const caller = appRouter.createCaller(createAuthContext({ name: "Ops Console", email: "ops@example.com", role: "admin" }));
    const swarm = (await caller.controlPlane.snapshot()).agentSwarms[0]!;

    const created = await caller.swarmReports.createSubscription({
      swarmId: swarm.id,
      cadence: "daily",
      format: "csv",
      recipientRoleLabel: "Head of Operations",
      startImmediately: true,
    });

    expect(created.cadence).toBe("daily");
    expect(created.format).toBe("csv");

    const snapshot = await caller.controlPlane.snapshot();
    expect(snapshot.swarmReportSubscriptions.some(item => item.id === created.id)).toBe(true);
    expect(snapshot.swarmReportExports.some(item => item.triggerSource === "subscription" && item.swarmId === swarm.id)).toBe(true);
  });

  it.skipIf(!process.env.DATABASE_URL)("processes due governance-report subscriptions on explicit scheduled execution even without startImmediately", async () => {
    const adminCaller = appRouter.createCaller(createAuthContext({ name: "Ops Console", email: "ops@example.com", role: "admin" }));
    const userCaller = appRouter.createCaller(createAuthContext({ id: 7, name: "Ops User", email: "ops-user@example.com", role: "user", openId: "ops-user" }));
    const swarm = (await adminCaller.controlPlane.snapshot()).agentSwarms[0]!;

    const created = await adminCaller.swarmReports.createSubscription({
      swarmId: swarm.id,
      cadence: "weekly",
      format: "pdf",
      recipientRoleLabel: "Governance Board",
      startImmediately: false,
    });

    const db = await getDb();
    await db
      .update(swarmReportSubscriptions)
      .set({ nextRunAt: new Date(Date.now() - 60_000) })
      .where(eq(swarmReportSubscriptions.id, created.id));

    const processed = await adminCaller.swarmReports.processDueSubscriptions();
    expect(processed.exports.some(item => item.swarmId === swarm.id && item.triggerSource === "subscription")).toBe(true);

    await expect(userCaller.swarmReports.processDueSubscriptions()).rejects.toThrow("Nur Admins dürfen fällige Governance-Report-Abos ausführen.");
  });

  it("creates autonomous swarm runs with delegated and feedback events across multiple members", async () => {
    const caller = appRouter.createCaller(createAuthContext({ name: "Ops Console", email: "ops@example.com", role: "admin" }));
    const swarm = (await caller.controlPlane.snapshot()).agentSwarms[0]!;

    const run = await caller.agents.createAutonomyRun({
      swarmId: swarm.id,
      objective: "Koordiniere einen mehrstufigen Incident-Review mit Analyse, Kundenkommunikation und Governance-Abschluss.",
      context: "Die Teilaufgaben sollen entlang der vorhandenen Schwarmrollen verteilt und rückgekoppelt werden.",
      priority: "urgent",
    });

    expect(run.status).toBe("completed");
    expect(run.steps.length).toBeGreaterThan(1);
    expect(new Set(run.steps.map(step => step.assignedAgentId)).size).toBeGreaterThan(1);
    expect(run.events.some(event => event.eventType === "delegated")).toBe(true);
    expect(run.events.some(event => event.eventType === "feedback")).toBe(true);
    expect(run.events.some(event => event.eventType === "completed")).toBe(true);
    expect(run.steps.every(step => step.status === "completed" && step.output)).toBe(true);

    const firstStep = run.steps.find(step => step.sequence === 1)!;
    const secondStep = run.steps.find(step => step.sequence === 2)!;
    const secondDelegation = run.events.find(event => event.eventType === "delegated" && event.stepId === secondStep.id);

    expect(secondStep.instructions).toContain(`Vorheriges Feedback aus Schritt 1 von ${firstStep.assignedAgentName}: ${firstStep.output}`);
    expect(secondDelegation?.detail).toContain(`Vorheriges Feedback aus Schritt 1 von ${firstStep.assignedAgentName}: ${firstStep.output}`);
  });

  it("exposes autonomous swarm runs in the control-plane snapshot with steps and event history", async () => {
    const caller = appRouter.createCaller(createAuthContext({ name: "Ops Console", email: "ops@example.com", role: "admin" }));
    const swarm = (await caller.controlPlane.snapshot()).agentSwarms[0]!;

    const created = await caller.agents.createAutonomyRun({
      swarmId: swarm.id,
      objective: "Bereite einen koordinierten Governance-Lauf mit Statusrückmeldungen und Abschlusszusammenfassung vor.",
      context: "Der Snapshot soll echte Laufdaten mit Schritten und Ereignissen enthalten.",
      priority: "standard",
    });

    const snapshot = await caller.controlPlane.snapshot();
    const run = snapshot.swarmAutonomyRuns.find(item => item.id === created.id);

    expect(run).toBeDefined();
    expect(run?.steps.length).toBeGreaterThan(0);
    expect(run?.events.some(event => event.eventType === "delegated")).toBe(true);
    expect(run?.events.some(event => event.eventType === "feedback")).toBe(true);
  });

  it("blocks sensitive autonomous runs for users, allows admin approval and supports pause, resume and cancel controls", async () => {
    const adminCaller = appRouter.createCaller(createAuthContext({ name: "Ops Console", email: "ops@example.com", role: "admin" }));
    const userCaller = appRouter.createCaller(createAuthContext({ id: 9, name: "Operations Analyst", email: "analyst@example.com", role: "user", openId: "ops-analyst" }));
    const swarm = (await adminCaller.controlPlane.snapshot()).agentSwarms[0]!;

    const awaitingApproval = await userCaller.agents.createAutonomyRun({
      swarmId: swarm.id,
      objective: "Deploy production payment workflow mit sensiblen Zahlungsdaten und ERP-Override koordinieren.",
      context: "Dieser Lauf soll wegen sensitiver Ziele zunächst eine Governance-Freigabe verlangen.",
      priority: "critical",
    });

    expect(awaitingApproval.status).toBe("blocked");
    expect(awaitingApproval.governanceStatus).toBe("blocked");

    await expect(userCaller.agents.controlAutonomyRun({
      swarmId: swarm.id,
      runId: awaitingApproval.id,
      action: "approve",
    })).rejects.toThrow("Nur Admins dürfen autonome Schwarmaufträge freigeben.");

    const approved = await adminCaller.agents.controlAutonomyRun({
      swarmId: swarm.id,
      runId: awaitingApproval.id,
      action: "approve",
    });

    expect(approved.status).toBe("completed");
    expect(approved.events.some(event => event.eventType === "resumed")).toBe(true);

    const controllable = await userCaller.agents.createAutonomyRun({
      swarmId: swarm.id,
      objective: "Deploy production payment workflow mit zusätzlichem ERP-Override und sensiblen Zahlungsdaten prüfen.",
      context: "Dieser zweite Lauf bleibt zunächst in Governance-Wartestellung, damit Pause, Fortsetzen und Abbruch separat geprüft werden können.",
      priority: "critical",
    });

    const paused = await adminCaller.agents.controlAutonomyRun({
      swarmId: swarm.id,
      runId: controllable.id,
      action: "pause",
    });
    expect(paused.status).toBe("paused");
    expect(paused.events.some(event => event.eventType === "paused")).toBe(true);

    const resumed = await adminCaller.agents.controlAutonomyRun({
      swarmId: swarm.id,
      runId: controllable.id,
      action: "resume",
    });
    expect(["planned", "running", "completed"]).toContain(resumed.status);
    expect(resumed.events.some(event => event.eventType === "resumed")).toBe(true);

    const controllableAfterResume = await userCaller.agents.createAutonomyRun({
      swarmId: swarm.id,
      objective: "Deploy production payout rollback mit sensiblen Finanzdaten zur späteren Governance-Stornierung vorbereiten.",
      context: "Dieser dritte Lauf dient ausschließlich dem Nachweis einer aktiven Cancel-Aktion.",
      priority: "critical",
    });

    const cancelled = await adminCaller.agents.controlAutonomyRun({
      swarmId: swarm.id,
      runId: controllableAfterResume.id,
      action: "cancel",
    });
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.events.some(event => event.eventType === "cancelled")).toBe(true);
  });

  it("creates an awaiting-approval autonomy run on swarms with approval-required governance and releases it via admin approval", async () => {
    const adminCaller = appRouter.createCaller(createAuthContext({ name: "Ops Console", email: "ops@example.com", role: "admin" }));
    const userCaller = appRouter.createCaller(createAuthContext({ id: 10, name: "Approval Analyst", email: "approval@example.com", role: "user", openId: "approval-user" }));

    const approvalSwarm = await adminCaller.agents.createSwarm({
      name: `Autonomy Approval Swarm ${Date.now()}`,
      mission: "Koordiniert sensible, aber freigabefähige Governance-Läufe zwischen Planung, Ausführung und Abschluss.",
      topology: "pipeline",
      coordinationMode: "planner_executor",
      team: "Governance Operations",
      owner: "Ops Console",
      environment: "staging",
      governance: {
        policyMode: "approval_required",
        approvalRequired: true,
        approverRole: "governance_admin",
        escalationTarget: "VP Governance",
        slaMinutes: 30,
        escalationAfterMinutes: 60,
        reportingWindowHours: 12,
      },
      members: [
        {
          name: "Plan Coordinator",
          role: "planner",
          description: "Leitet sensible Governance-Läufe an und strukturiert die Delegation.",
          model: "gpt-4.1",
          tools: ["Policy Registry", "Audit Log"],
        },
        {
          name: "Execution Analyst",
          role: "executor",
          description: "Führt freigegebene Teilaufgaben aus und meldet belastbare Zwischenstände zurück.",
          model: "gpt-4.1-mini",
          tools: ["Runbooks", "Evidence Store"],
        },
      ],
    });

    const awaitingApproval = await userCaller.agents.createAutonomyRun({
      swarmId: approvalSwarm.id,
      objective: "Deploy production payment workflow mit sensiblen Zahlungsdaten im Freigabemodus koordinieren.",
      context: "Dieser Lauf soll wegen approval_required zuerst im Freigabestatus verbleiben.",
      priority: "critical",
    });

    expect(awaitingApproval.status).toBe("awaiting_approval");
    expect(awaitingApproval.governanceStatus).toBe("approval_required");
    expect(awaitingApproval.steps.every(step => step.status === "awaiting_input")).toBe(true);

    const released = await adminCaller.agents.controlAutonomyRun({
      swarmId: approvalSwarm.id,
      runId: awaitingApproval.id,
      action: "approve",
    });

    expect(released.status).toBe("completed");
    expect(released.governanceStatus).toBe("clear");
    expect(released.events.some(event => event.eventType === "resumed")).toBe(true);
  });
});
