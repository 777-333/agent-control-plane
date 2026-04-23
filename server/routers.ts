import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  applyApprovalChainToApproval,
  createAgent,
  createAgentSwarm,
  duplicateAgent,
  updateAgent,
  createApprovalChainTemplate,
  createApprovalNotification,
  createEvaluationRun,
  createGuardrailEvent,
  createPermission,
  createPolicy,
  createPrivacyRule,
  createTeam,
  getAccessOverview,
  getControlPlaneSnapshot,
  getDashboardOverview,
  listAgents,
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
  resolveApprovalStage,
  escalateApproval,
  updateApprovalChainTemplate,
} from "./db";
import { notifyOwner } from "./_core/notification";

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
