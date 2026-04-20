import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  applyApprovalChainToApproval,
  createAgent,
  createApprovalChainTemplate,
  createEvaluationRun,
  createGuardrailEvent,
  createPermission,
  createPolicy,
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
          stages: z.array(
            z.object({
              stageName: z.string().min(2),
              requiredRole: z.string().min(2),
              defaultApproverLabel: z.string().min(2),
              stageMode: z.enum(["serial", "parallel", "branch"]),
              laneKey: z.enum(["main", "parallel-a", "parallel-b", "branch-a", "branch-b"]),
              branchSourceStageOrder: z.number().int().nullable().optional(),
              branchLabel: z.string().max(120).optional().default(""),
              branchOperator: z.enum(["always", "equals", "contains", "greater_than", "less_than"]),
              branchValue: z.string().max(160).optional().default(""),
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
          stages: z.array(
            z.object({
              stageName: z.string().min(2),
              requiredRole: z.string().min(2),
              defaultApproverLabel: z.string().min(2),
              stageMode: z.enum(["serial", "parallel", "branch"]),
              laneKey: z.enum(["main", "parallel-a", "parallel-b", "branch-a", "branch-b"]),
              branchSourceStageOrder: z.number().int().nullable().optional(),
              branchLabel: z.string().max(120).optional().default(""),
              branchOperator: z.enum(["always", "equals", "contains", "greater_than", "less_than"]),
              branchValue: z.string().max(160).optional().default(""),
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
      .mutation(async ({ ctx, input }) =>
        resolveApprovalStage({
          approvalId: input.approvalId,
          decision: input.decision,
          approver: ctx.user.name || ctx.user.email || "Current User",
          note: input.note,
        }),
      ),
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
        }),
      )
      .mutation(async ({ input }) => {
        const delivered = await notifyOwner({
          title: `Approval Workflow: ${input.approvalTitle}`,
          content: `Eine Freigabe mit Priorität ${input.severity} wurde zur Prüfung oder Eskalation markiert.`,
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
  observability: router({
    metrics: protectedProcedure.query(async () => listMetricSnapshots()),
  }),
});

export type AppRouter = typeof appRouter;
