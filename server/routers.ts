import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { orgAdminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  applyApprovalChainToApproval,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  getBillingOverview,
  listPlans,
  setTenantPlan,
  getTeamOverview,
  inviteMember,
  cancelInvite,
  changeMemberRole,
  removeMember,
  renameOrg,
  listInvitesForEmail,
  acceptInvite,
  leaveOrg,
  createAgent,
  createAgentSwarm,
  dissolveAgentSwarm,
  duplicateAgent,
  updateAgent,
  updateAgentSwarm,
  createApprovalChainTemplate,
  createApprovalNotification,
  createAutonomousSwarmRun,
  createEvaluationRun,
  createGuardrailEvent,
  createPermission,
  createPolicy,
  createPrivacyRule,
  createSwarmReportSubscription,
  runDueSwarmReportSubscriptions,
  createTeam,
  controlAutonomousSwarmRun,
  getAccessOverview,
  getControlPlaneSnapshot,
  getDashboardOverview,
  listAgents,
  postAgentSwarmMessage,
  listApprovalChains,
  listApprovals,
  listAuditEvents,
  listConnectors,
  listEvaluations,
  listGuardrailEvents,
  listMetricSnapshots,
  listPolicies,
  listPrivacyRules,
  removePrivacyRule,
  requestSwarmReportDownload,
  resolveApprovalStage,
  resolveSwarmReportDownloadApproval,
  escalateApproval,
  updateApprovalChainTemplate,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { sendInviteEmail } from "./_core/mailer";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  controlPlane: router({
    snapshot: protectedProcedure.query(async () => getControlPlaneSnapshot()),
  }),
  apiKeys: router({
    list: protectedProcedure.query(() => listApiKeys()),
    create: orgAdminProcedure
      .input(z.object({ label: z.string().min(1).max(80) }))
      .mutation(({ input }) => createApiKey(input.label)),
    revoke: orgAdminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => revokeApiKey(input.id)),
  }),
  billing: router({
    overview: protectedProcedure.query(() => getBillingOverview()),
    plans: protectedProcedure.query(() => listPlans()),
    selectPlan: orgAdminProcedure
      .input(z.object({ planId: z.string().min(1) }))
      .mutation(({ input }) => setTenantPlan(input.planId)),
  }),
  team: router({
    overview: protectedProcedure.query(() => getTeamOverview()),
    myInvites: protectedProcedure.query(({ ctx }) => listInvitesForEmail(ctx.user?.email ?? null)),
    invite: orgAdminProcedure
      .input(z.object({ email: z.string().email(), role: z.enum(["admin", "member", "viewer"]) }))
      .mutation(({ input, ctx }) => {
        const invitedBy = ctx.user?.name ?? ctx.user?.email ?? "Admin";
        const overview = inviteMember(input.email, input.role, invitedBy);
        // Fire-and-forget: never fail the invite because email delivery failed.
        void sendInviteEmail({ to: input.email, orgName: overview.org.name, role: input.role, invitedBy });
        return overview;
      }),
    cancelInvite: orgAdminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => cancelInvite(input.id)),
    changeRole: orgAdminProcedure
      .input(z.object({ openId: z.string().min(1), role: z.enum(["admin", "member", "viewer"]) }))
      .mutation(({ input }) => changeMemberRole(input.openId, input.role)),
    removeMember: orgAdminProcedure
      .input(z.object({ openId: z.string().min(1) }))
      .mutation(({ input }) => removeMember(input.openId)),
    renameOrg: orgAdminProcedure
      .input(z.object({ name: z.string().min(2).max(80) }))
      .mutation(({ input }) => renameOrg(input.name)),
    acceptInvite: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input, ctx }) =>
        acceptInvite({
          id: input.id,
          openId: ctx.user!.openId,
          email: ctx.user?.email ?? null,
          name: ctx.user?.name ?? null,
        })
      ),
    leave: protectedProcedure.mutation(({ ctx }) =>
      leaveOrg({ openId: ctx.user!.openId, email: ctx.user?.email ?? null, name: ctx.user?.name ?? null })
    ),
  }),
  dashboard: router({
    overview: protectedProcedure.query(async () => getDashboardOverview()),
  }),
  agents: router({
    list: protectedProcedure.query(async () => listAgents()),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          description: z.string().min(10),
          team: z.string().min(2),
          owner: z.string().min(2),
          model: z.string().min(2),
          environment: z.enum(["production", "staging", "development"]),
        }),
      )
      .mutation(async ({ input }) => createAgent(input)),
    createSwarm: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          mission: z.string().min(12),
          topology: z.enum(["mesh", "hub_spoke", "pipeline"]),
          coordinationMode: z.enum(["consensus", "planner_executor", "supervisor"]),
          team: z.string().min(2),
          owner: z.string().min(2),
          environment: z.enum(["production", "staging", "development"]),
          governance: z.object({
            policyMode: z.enum(["monitoring", "approval_required", "enforced"]),
            approvalRequired: z.boolean(),
            approverRole: z.string().min(2),
            escalationTarget: z.string().min(2),
            slaMinutes: z.number().int().min(5).max(1440),
            escalationAfterMinutes: z.number().int().min(5).max(2880),
            reportingWindowHours: z.number().int().min(1).max(720),
          }),
          members: z.array(
            z.object({
              name: z.string().min(2),
              role: z.string().min(2),
              description: z.string().min(10),
              model: z.string().min(2),
              tools: z.array(z.string().min(2)).min(1),
            }),
          ).min(2).max(8),
        }),
      )
      .mutation(async ({ input }) => createAgentSwarm(input)),
    updateSwarm: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          name: z.string().min(2),
          mission: z.string().min(12),
          topology: z.enum(["mesh", "hub_spoke", "pipeline"]),
          coordinationMode: z.enum(["consensus", "planner_executor", "supervisor"]),
          team: z.string().min(2),
          owner: z.string().min(2),
          environment: z.enum(["production", "staging", "development"]),
          governance: z.object({
            policyMode: z.enum(["monitoring", "approval_required", "enforced"]),
            approvalRequired: z.boolean(),
            approverRole: z.string().min(2),
            escalationTarget: z.string().min(2),
            slaMinutes: z.number().int().min(5).max(1440),
            escalationAfterMinutes: z.number().int().min(5).max(2880),
            reportingWindowHours: z.number().int().min(1).max(720),
          }),
          members: z.array(
            z.object({
              name: z.string().min(2),
              role: z.string().min(2),
              description: z.string().min(10),
              model: z.string().min(2),
              tools: z.array(z.string().min(2)).min(1),
            }),
          ).min(2).max(8),
        }),
      )
      .mutation(async ({ input }) => updateAgentSwarm(input)),
    dissolveSwarm: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          mode: z.enum(["retain_agents", "remove_agents"]),
        }),
      )
      .mutation(async ({ input }) => dissolveAgentSwarm(input)),
    postSwarmMessage: protectedProcedure
      .input(
        z.object({
          swarmId: z.number().int(),
          communicationLinkId: z.number().int(),
          senderAgentId: z.number().int(),
          content: z.string().min(8),
          kind: z.enum(["directive", "status", "evidence", "approval"]),
        }),
      )
      .mutation(async ({ input }) => postAgentSwarmMessage(input)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          name: z.string().min(2),
          description: z.string().min(10),
          team: z.string().min(2),
          owner: z.string().min(2),
          model: z.string().min(2),
          environment: z.enum(["production", "staging", "development"]),
        }),
      )
      .mutation(async ({ input }) => updateAgent(input)),
    duplicate: protectedProcedure
      .input(
        z.object({
          sourceAgentId: z.number().int(),
          name: z.string().min(2),
          description: z.string().min(10),
          team: z.string().min(2),
          owner: z.string().min(2),
          model: z.string().min(2),
          environment: z.enum(["production", "staging", "development"]),
        }),
      )
      .mutation(async ({ input }) => duplicateAgent(input)),
    createAutonomyRun: protectedProcedure
      .input(
        z.object({
          swarmId: z.number().int(),
          objective: z.string().min(12),
          context: z.string().max(4000).optional(),
          priority: z.enum(["standard", "urgent", "critical"]).default("standard"),
        }),
      )
      .mutation(async ({ ctx, input }) =>
        createAutonomousSwarmRun({
          swarmId: input.swarmId,
          objective: input.objective,
          context: input.context,
          priority: input.priority,
          requestedByUserId: ctx.user.id ?? null,
          requestedByLabel: ctx.user.name || ctx.user.email || "Current User",
          requestedByRole: ctx.user.role,
        })),
    controlAutonomyRun: protectedProcedure
      .input(
        z.object({
          swarmId: z.number().int(),
          runId: z.number().int(),
          action: z.enum(["pause", "resume", "cancel", "approve"]),
        }),
      )
      .mutation(async ({ ctx, input }) =>
        controlAutonomousSwarmRun({
          swarmId: input.swarmId,
          runId: input.runId,
          action: input.action,
          actorLabel: ctx.user.name || ctx.user.email || "Current User",
          actorRole: ctx.user.role,
        })),
  }),
  policies: router({
    list: protectedProcedure.query(async () => listPolicies()),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          scopeType: z.string().min(2),
          scopeRef: z.string().min(2),
          actionPattern: z.string().min(2),
          effect: z.enum(["allowed", "forbidden", "approval_required"]),
          priority: z.number().int().min(1).max(999),
          description: z.string().min(8),
        }),
      )
      .mutation(async ({ input }) => createPolicy(input)),
  }),
  access: router({
    overview: protectedProcedure.query(async () => getAccessOverview()),
    createTeam: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          owner: z.string().min(2),
          coverage: z.string().min(2),
        }),
      )
      .mutation(async ({ input }) => createTeam(input)),
    createPermission: protectedProcedure
      .input(
        z.object({
          subject: z.string().min(2),
          subjectType: z.enum(["user", "team"]),
          agentName: z.string().min(2),
          permissionLevel: z.enum(["viewer", "operator", "approver", "admin"]),
          toolScope: z.string().min(2),
        }),
      )
      .mutation(async ({ input }) => createPermission(input)),
  }),
  swarmReports: router({
    requestDownload: protectedProcedure
      .input(
        z.object({
          swarmId: z.number().int(),
          format: z.enum(["csv", "pdf"]),
          reason: z.string().min(6),
        }),
      )
      .mutation(async ({ ctx, input }) =>
        requestSwarmReportDownload({
          swarmId: input.swarmId,
          format: input.format,
          reason: input.reason,
          requestedByUserId: ctx.user.id ?? null,
          requestedByLabel: ctx.user.name || ctx.user.email || "Current User",
          requestedBySystemRole: ctx.user.role,
        })),
    resolveDownloadApproval: protectedProcedure
      .input(
        z.object({
          approvalId: z.number().int(),
          decision: z.enum(["approved", "rejected"]),
        }),
      )
      .mutation(async ({ ctx, input }) =>
        resolveSwarmReportDownloadApproval({
          approvalId: input.approvalId,
          decision: input.decision,
          resolvedByUserId: ctx.user.id ?? null,
          resolvedByLabel: ctx.user.name || ctx.user.email || "Current User",
          resolvedBySystemRole: ctx.user.role,
        })),
    createSubscription: protectedProcedure
      .input(
        z.object({
          swarmId: z.number().int(),
          cadence: z.enum(["daily", "weekly", "monthly"]),
          format: z.enum(["csv", "pdf"]),
          recipientRoleLabel: z.string().min(2),
          startImmediately: z.boolean(),
        }),
      )
      .mutation(async ({ ctx, input }) =>
        createSwarmReportSubscription({
          swarmId: input.swarmId,
          cadence: input.cadence,
          format: input.format,
          recipientRoleLabel: input.recipientRoleLabel,
          createdByUserId: ctx.user.id ?? null,
          createdByLabel: ctx.user.name || ctx.user.email || "Current User",
          startImmediately: input.startImmediately,
        })),
    processDueSubscriptions: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Admins dürfen fällige Governance-Report-Abos ausführen." });
      }
      return runDueSwarmReportSubscriptions();
    }),
  }),
  approvals: router({
    list: protectedProcedure.query(async () => listApprovals()),
    chains: protectedProcedure.query(async () => listApprovalChains()),
    createChain: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          description: z.string().min(8),
          escalationMode: z.enum(["serial", "parallel", "auto_escalate"]),
          calendarProfile: z.object({
            presetId: z.string().min(2),
            businessDayStartHour: z.number().int().min(0).max(23),
            businessDayEndHour: z.number().int().min(1).max(24),
            workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
            holidayDates: z.array(z.string().min(10).max(10)).max(20),
          }).optional(),
          stages: z.array(
            z.object({
              stageName: z.string().min(2),
              requiredRole: z.string().min(2),
              defaultApproverLabel: z.string().min(2),
              stageMode: z.enum(["serial", "parallel", "branch"]),
              laneKey: z.enum(["main", "parallel-a", "parallel-b", "branch-a", "branch-b"]),
              branchSourceStageOrder: z.number().int().nullable().optional(),
              branchLabel: z.string().max(120).optional().default(""),
              branchField: z.enum(["riskLevel", "requestedBy", "agentName", "title", "summary", "chainName", "escalationStatus"]).optional().default("riskLevel"),
              branchOperator: z.enum(["always", "equals", "contains", "greater_than", "less_than"]),
              branchValue: z.string().max(160).optional().default(""),
              quorumMode: z.enum(["all", "majority", "minimum_count", "distinct_roles"]).optional().default("all"),
              quorumTarget: z.number().int().min(1).max(20).optional().default(1),
              slaMinutes: z.number().int().min(1).max(1440),
              escalationAfterMinutes: z.number().int().min(1).max(2880),
              escalationTargetLabel: z.string().min(2),
            }),
          ).min(1),
        }),
      )
      .mutation(async ({ input }) => createApprovalChainTemplate(input)),
    updateChain: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          name: z.string().min(2),
          description: z.string().min(8),
          escalationMode: z.enum(["serial", "parallel", "auto_escalate"]),
          calendarProfile: z.object({
            presetId: z.string().min(2),
            businessDayStartHour: z.number().int().min(0).max(23),
            businessDayEndHour: z.number().int().min(1).max(24),
            workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
            holidayDates: z.array(z.string().min(10).max(10)).max(20),
          }).optional(),
          stages: z.array(
            z.object({
              stageName: z.string().min(2),
              requiredRole: z.string().min(2),
              defaultApproverLabel: z.string().min(2),
              stageMode: z.enum(["serial", "parallel", "branch"]),
              laneKey: z.enum(["main", "parallel-a", "parallel-b", "branch-a", "branch-b"]),
              branchSourceStageOrder: z.number().int().nullable().optional(),
              branchLabel: z.string().max(120).optional().default(""),
              branchField: z.enum(["riskLevel", "requestedBy", "agentName", "title", "summary", "chainName", "escalationStatus"]).optional().default("riskLevel"),
              branchOperator: z.enum(["always", "equals", "contains", "greater_than", "less_than"]),
              branchValue: z.string().max(160).optional().default(""),
              quorumMode: z.enum(["all", "majority", "minimum_count", "distinct_roles"]).optional().default("all"),
              quorumTarget: z.number().int().min(1).max(20).optional().default(1),
              slaMinutes: z.number().int().min(1).max(1440),
              escalationAfterMinutes: z.number().int().min(1).max(2880),
              escalationTargetLabel: z.string().min(2),
            }),
          ).min(1),
        }),
      )
      .mutation(async ({ input }) => updateApprovalChainTemplate(input)),
    assignChain: protectedProcedure
      .input(
        z.object({
          approvalId: z.number().int(),
          chainId: z.number().int(),
        }),
      )
      .mutation(async ({ ctx, input }) =>
        applyApprovalChainToApproval({
          approvalId: input.approvalId,
          chainId: input.chainId,
          triggeredBy: ctx.user.name || ctx.user.email || "Current User",
        }),
      ),
    resolve: protectedProcedure
      .input(
        z.object({
          approvalId: z.number().int(),
          decision: z.enum(["approved", "rejected"]),
          note: z.string().max(500).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const resolved = await resolveApprovalStage({
          approvalId: input.approvalId,
          decision: input.decision,
          approver: ctx.user.name || ctx.user.email || "Current User",
          note: input.note,
        });
        const currentStage = resolved.stages.find(stage => stage.order === resolved.currentStageOrder);
        await createApprovalNotification({
          approvalId: resolved.id,
          approvalTitle: resolved.title,
          severity: resolved.riskLevel,
          recipientRole: currentStage?.requiredRole ?? "completed",
          ownerLabel: currentStage?.ownerLabel ?? resolved.approver ?? "workflow-complete",
          escalationTarget: currentStage?.escalationTarget,
          actionType: input.decision === "approved" ? "resolution" : "handover",
        });
        await notifyOwner({
          title: `Approval ${input.decision === "approved" ? "Update" : "Reject"}: ${resolved.title}`,
          content: input.decision === "approved"
            ? `Die Freigabe wurde von ${ctx.user.name || ctx.user.email || "Current User"} bearbeitet. Nächste verantwortliche Rolle: ${currentStage?.requiredRole ?? "keine weitere Stufe"}. Aktueller Owner: ${currentStage?.ownerLabel ?? resolved.approver ?? "abgeschlossen"}.`
            : `Die Freigabe wurde von ${ctx.user.name || ctx.user.email || "Current User"} abgelehnt. Betroffene Rolle: ${currentStage?.requiredRole ?? "abgeschlossen"}. Hinweis: ${input.note ?? "kein Zusatzkommentar"}`,
        });
        return resolved;
      }),
    escalate: protectedProcedure
      .input(
        z.object({
          approvalId: z.number().int(),
          reason: z.string().min(4),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const escalated = await escalateApproval({
          approvalId: input.approvalId,
          reason: input.reason,
          triggeredBy: ctx.user.name || ctx.user.email || "Current User",
        });
        const currentStage = escalated.stages.find(stage => stage.order === escalated.currentStageOrder);
        await createApprovalNotification({
          approvalId: escalated.id,
          approvalTitle: escalated.title,
          severity: escalated.riskLevel,
          recipientRole: currentStage?.requiredRole ?? "admin",
          ownerLabel: currentStage?.ownerLabel ?? "unbekannt",
          escalationTarget: currentStage?.escalationTarget,
          actionType: "escalation",
        });
        await notifyOwner({
          title: `Approval Escalation: ${escalated.title}`,
          content: `Die aktuelle Freigabestufe wurde eskaliert. Neuer Owner: ${escalated.stages.find(stage => stage.order === escalated.currentStageOrder)?.ownerLabel ?? "unbekannt"}. Grund: ${input.reason}`,
        });
        return escalated;
      }),
    notify: protectedProcedure
      .input(
        z.object({
          approvalTitle: z.string().min(2),
          severity: z.string().min(2),
          recipientRole: z.string().min(2),
          ownerLabel: z.string().min(2),
          escalationTarget: z.string().min(2).optional(),
          actionType: z.enum(["review", "escalation", "handover"]).default("review"),
        }),
      )
      .mutation(async ({ input }) => {
        await createApprovalNotification({
          approvalId: 0,
          approvalTitle: input.approvalTitle,
          severity: input.severity,
          recipientRole: input.recipientRole,
          ownerLabel: input.ownerLabel,
          escalationTarget: input.escalationTarget,
          actionType: input.actionType,
        });
        const delivered = await notifyOwner({
          title: `Approval Workflow: ${input.approvalTitle}`,
          content: `Rolle ${input.recipientRole} wurde für ${input.actionType === "escalation" ? "eine Eskalation" : input.actionType === "handover" ? "eine Übergabe" : "eine Freigabeprüfung"} adressiert. Aktueller Owner: ${input.ownerLabel}. Priorität: ${input.severity}.${input.escalationTarget ? ` Eskalationsziel: ${input.escalationTarget}.` : ""}`,
        });
        return { delivered };
      }),
  }),
  audit: router({
    list: protectedProcedure.query(async () => listAuditEvents()),
  }),
  connectors: router({
    list: protectedProcedure.query(async () => listConnectors()),
  }),
  evaluations: router({
    list: protectedProcedure.query(async () => listEvaluations()),
    run: protectedProcedure
      .input(
        z.object({
          agentId: z.number().int(),
          name: z.string().min(2),
          expectedOutcome: z.string().min(8),
        }),
      )
      .mutation(async ({ input }) => createEvaluationRun(input)),
  }),
  guardrails: router({
    list: protectedProcedure.query(async () => listGuardrailEvents()),
    trigger: protectedProcedure
      .input(
        z.object({
          agentId: z.number().int(),
          triggerType: z.string().min(2),
          thresholdLabel: z.string().min(2),
          detail: z.string().min(8),
        }),
      )
      .mutation(async ({ input }) => createGuardrailEvent(input)),
  }),
  privacyRules: router({
    list: protectedProcedure.query(async () => listPrivacyRules()),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          kind: z.enum(["contextual", "regex"]),
          category: z.enum(["email", "phone", "iban", "bank_account", "tax_identifier", "personal_identifier", "drivers_license", "health_insurance", "passport", "payment_card"]),
          keywords: z.array(z.string().min(1)).optional(),
          pattern: z.string().optional(),
          flags: z.string().optional(),
          validator: z.enum(["none", "phone", "iban", "payment_card"]).optional(),
        }),
      )
      .mutation(async ({ input }) => createPrivacyRule(input)),
    remove: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
        }),
      )
      .mutation(async ({ input }) => removePrivacyRule(input)),
  }),
  observability: router({
    metrics: protectedProcedure.query(async () => listMetricSnapshots()),
  }),
});

export type AppRouter = typeof appRouter;
