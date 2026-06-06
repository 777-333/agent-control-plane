CREATE TYPE "public"."action_status" AS ENUM('executed', 'blocked', 'pending_approval', 'failed');--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('agent', 'user', 'system');--> statement-breakpoint
CREATE TYPE "public"."agent_connector_mode" AS ENUM('read', 'write', 'approve');--> statement-breakpoint
CREATE TYPE "public"."agent_status" AS ENUM('healthy', 'warning', 'paused', 'offline');--> statement-breakpoint
CREATE TYPE "public"."approval_escalation_status" AS ENUM('none', 'pending', 'escalated', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."autonomy_event_type" AS ENUM('planned', 'delegated', 'feedback', 'governance', 'paused', 'resumed', 'cancelled', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."autonomy_priority" AS ENUM('standard', 'urgent', 'critical');--> statement-breakpoint
CREATE TYPE "public"."autonomy_run_status" AS ENUM('planned', 'running', 'awaiting_approval', 'blocked', 'paused', 'completed', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."autonomy_step_status" AS ENUM('pending', 'in_progress', 'completed', 'blocked', 'awaiting_input', 'skipped', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."boolish" AS ENUM('true', 'false');--> statement-breakpoint
CREATE TYPE "public"."branch_field" AS ENUM('riskLevel', 'requestedBy', 'agentName', 'title', 'summary', 'chainName', 'escalationStatus');--> statement-breakpoint
CREATE TYPE "public"."branch_operator" AS ENUM('always', 'equals', 'contains', 'greater_than', 'less_than');--> statement-breakpoint
CREATE TYPE "public"."cadence" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."connector_status" AS ENUM('connected', 'degraded', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."connector_type" AS ENUM('CRM', 'ERP', 'E-Mail', 'Browser', 'Datenbank');--> statement-breakpoint
CREATE TYPE "public"."download_request_status" AS ENUM('pending', 'approved', 'rejected', 'consumed');--> statement-breakpoint
CREATE TYPE "public"."environment" AS ENUM('production', 'staging', 'development');--> statement-breakpoint
CREATE TYPE "public"."escalation_mode" AS ENUM('serial', 'parallel', 'auto_escalate');--> statement-breakpoint
CREATE TYPE "public"."evaluation_case_status" AS ENUM('passed', 'failed', 'warning');--> statement-breakpoint
CREATE TYPE "public"."evaluation_status" AS ENUM('draft', 'running', 'passed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."governance_status" AS ENUM('clear', 'approval_required', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."guardrail_status" AS ENUM('monitoring', 'stopped', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."guardrail_trigger" AS ENUM('policy_violation', 'cost_threshold', 'tool_anomaly', 'latency_spike');--> statement-breakpoint
CREATE TYPE "public"."permission_level" AS ENUM('viewer', 'operator', 'approver', 'admin');--> statement-breakpoint
CREATE TYPE "public"."policy_effect" AS ENUM('allowed', 'forbidden', 'approval_required');--> statement-breakpoint
CREATE TYPE "public"."policy_mode" AS ENUM('enforced', 'monitoring', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."policy_scope_type" AS ENUM('agent', 'team', 'connector', 'global');--> statement-breakpoint
CREATE TYPE "public"."quorum_mode" AS ENUM('all', 'majority', 'minimum_count', 'distinct_roles');--> statement-breakpoint
CREATE TYPE "public"."report_format" AS ENUM('csv', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."stage_mode" AS ENUM('serial', 'parallel', 'branch');--> statement-breakpoint
CREATE TYPE "public"."subject_type" AS ENUM('user', 'team');--> statement-breakpoint
CREATE TYPE "public"."swarm_message_kind" AS ENUM('directive', 'status', 'evidence', 'approval');--> statement-breakpoint
CREATE TYPE "public"."system_role" AS ENUM('user', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."trigger_source" AS ENUM('manual', 'approval', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "agentActions" (
	"id" serial PRIMARY KEY NOT NULL,
	"agentId" integer NOT NULL,
	"connectorId" integer,
	"actionType" varchar(140) NOT NULL,
	"status" "action_status" NOT NULL,
	"riskLevel" "risk_level" DEFAULT 'medium' NOT NULL,
	"estimatedCostUsd" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"tokenUsage" integer DEFAULT 0 NOT NULL,
	"summary" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agentConnectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"agentId" integer NOT NULL,
	"connectorId" integer NOT NULL,
	"permissionScope" varchar(120) NOT NULL,
	"mode" "agent_connector_mode" DEFAULT 'read' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agentPermissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"agentId" integer NOT NULL,
	"subjectType" "subject_type" NOT NULL,
	"subjectRef" varchar(80) NOT NULL,
	"permissionLevel" "permission_level" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(140) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text,
	"status" "agent_status" DEFAULT 'healthy' NOT NULL,
	"riskLevel" "risk_level" DEFAULT 'medium' NOT NULL,
	"ownerUserId" integer,
	"teamId" integer,
	"model" varchar(160) NOT NULL,
	"environment" "environment" DEFAULT 'production' NOT NULL,
	"policyMode" "policy_mode" DEFAULT 'enforced' NOT NULL,
	"lastHeartbeatAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "appCollections" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvalChains" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"escalationMode" "escalation_mode" DEFAULT 'serial' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvalStages" (
	"id" serial PRIMARY KEY NOT NULL,
	"chainId" integer NOT NULL,
	"stageOrder" integer NOT NULL,
	"stageName" varchar(140) NOT NULL,
	"requiredRole" varchar(100) NOT NULL,
	"defaultApproverLabel" varchar(160) NOT NULL,
	"stageMode" "stage_mode" DEFAULT 'serial' NOT NULL,
	"laneKey" varchar(80) DEFAULT 'main' NOT NULL,
	"branchSourceStageOrder" integer,
	"branchLabel" varchar(120),
	"branchField" "branch_field" DEFAULT 'riskLevel' NOT NULL,
	"branchOperator" "branch_operator" DEFAULT 'always' NOT NULL,
	"branchValue" varchar(160),
	"quorumMode" "quorum_mode" DEFAULT 'all' NOT NULL,
	"quorumTarget" integer DEFAULT 1 NOT NULL,
	"slaMinutes" integer DEFAULT 60 NOT NULL,
	"escalationAfterMinutes" integer DEFAULT 120 NOT NULL,
	"escalationTargetLabel" varchar(160) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"agentId" integer NOT NULL,
	"actionId" integer NOT NULL,
	"chainId" integer,
	"currentStageOrder" integer DEFAULT 1 NOT NULL,
	"escalationStatus" "approval_escalation_status" DEFAULT 'none' NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"requestedByUserId" integer,
	"approverUserId" integer,
	"summary" text NOT NULL,
	"requestedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"resolvedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auditEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"agentId" integer,
	"actionId" integer,
	"severity" "severity" DEFAULT 'info' NOT NULL,
	"category" varchar(100) NOT NULL,
	"title" varchar(180) NOT NULL,
	"detail" text NOT NULL,
	"actorType" "actor_type" DEFAULT 'system' NOT NULL,
	"actorRef" varchar(120) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"type" "connector_type" NOT NULL,
	"status" "connector_status" DEFAULT 'connected' NOT NULL,
	"endpointLabel" varchar(160) NOT NULL,
	"authMode" varchar(64) NOT NULL,
	"lastSyncAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluationCases" (
	"id" serial PRIMARY KEY NOT NULL,
	"evaluationId" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"expectedOutcome" text NOT NULL,
	"actualOutcome" text NOT NULL,
	"status" "evaluation_case_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"agentId" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"status" "evaluation_status" DEFAULT 'draft' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"policyPassRate" integer DEFAULT 0 NOT NULL,
	"summary" text NOT NULL,
	"executedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardrailEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"agentId" integer NOT NULL,
	"actionId" integer,
	"triggerType" "guardrail_trigger" NOT NULL,
	"status" "guardrail_status" DEFAULT 'monitoring' NOT NULL,
	"thresholdLabel" varchar(160) NOT NULL,
	"detail" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metricSnapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"agentId" integer,
	"latencyMs" integer DEFAULT 0 NOT NULL,
	"errorRate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"apiCostUsd" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"tokenUsage" integer DEFAULT 0 NOT NULL,
	"windowLabel" varchar(40) NOT NULL,
	"capturedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(140) NOT NULL,
	"scopeType" "policy_scope_type" DEFAULT 'agent' NOT NULL,
	"scopeRef" varchar(140) NOT NULL,
	"actionPattern" varchar(180) NOT NULL,
	"effect" "policy_effect" NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"isActive" "boolish" DEFAULT 'true' NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swarmAutonomyEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"runId" integer NOT NULL,
	"swarmId" integer NOT NULL,
	"stepId" integer,
	"eventType" "autonomy_event_type" NOT NULL,
	"actorLabel" varchar(160) NOT NULL,
	"detail" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swarmAutonomyRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"swarmId" integer NOT NULL,
	"objective" text NOT NULL,
	"context" text,
	"priority" "autonomy_priority" DEFAULT 'standard' NOT NULL,
	"status" "autonomy_run_status" DEFAULT 'planned' NOT NULL,
	"governanceStatus" "governance_status" DEFAULT 'clear' NOT NULL,
	"requestedByUserId" integer,
	"requestedByLabel" varchar(160) NOT NULL,
	"requestedByRole" "system_role" DEFAULT 'user' NOT NULL,
	"summary" text NOT NULL,
	"startedAt" timestamp with time zone,
	"completedAt" timestamp with time zone,
	"lastEventAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swarmAutonomySteps" (
	"id" serial PRIMARY KEY NOT NULL,
	"runId" integer NOT NULL,
	"swarmId" integer NOT NULL,
	"assignedAgentId" integer NOT NULL,
	"assignedAgentName" varchar(160) NOT NULL,
	"title" varchar(180) NOT NULL,
	"instructions" text NOT NULL,
	"status" "autonomy_step_status" DEFAULT 'pending' NOT NULL,
	"sequence" integer NOT NULL,
	"dependsOnStepId" integer,
	"output" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "swarmMessages" (
	"id" serial PRIMARY KEY NOT NULL,
	"swarmId" integer NOT NULL,
	"communicationLinkId" integer NOT NULL,
	"senderAgentId" integer NOT NULL,
	"senderAgentName" varchar(160) NOT NULL,
	"content" text NOT NULL,
	"kind" "swarm_message_kind" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swarmReportDownloadApprovals" (
	"id" serial PRIMARY KEY NOT NULL,
	"swarmId" integer NOT NULL,
	"format" "report_format" NOT NULL,
	"requestStatus" "download_request_status" DEFAULT 'pending' NOT NULL,
	"requiredRoleLabel" varchar(160) NOT NULL,
	"requestedByUserId" integer,
	"requestedByLabel" varchar(160) NOT NULL,
	"requestedBySystemRole" "user_role" DEFAULT 'user' NOT NULL,
	"approvedByUserId" integer,
	"approvedByLabel" varchar(160),
	"reason" text NOT NULL,
	"exportWindowHours" integer DEFAULT 24 NOT NULL,
	"sensitivityLabel" varchar(180) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"resolvedAt" timestamp with time zone,
	"consumedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "swarmReportExports" (
	"id" serial PRIMARY KEY NOT NULL,
	"swarmId" integer NOT NULL,
	"format" "report_format" NOT NULL,
	"triggerSource" "trigger_source" DEFAULT 'manual' NOT NULL,
	"triggeredByUserId" integer,
	"triggeredByLabel" varchar(160) NOT NULL,
	"requesterRole" "system_role" DEFAULT 'user' NOT NULL,
	"reportWindowHours" integer DEFAULT 24 NOT NULL,
	"communicationLinkCount" integer DEFAULT 0 NOT NULL,
	"approvalMessageCount" integer DEFAULT 0 NOT NULL,
	"overdueLinkCount" integer DEFAULT 0 NOT NULL,
	"averageResponseMinutes" integer DEFAULT 0 NOT NULL,
	"metadata" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swarmReportSubscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"swarmId" integer NOT NULL,
	"cadence" "cadence" NOT NULL,
	"format" "report_format" NOT NULL,
	"recipientRoleLabel" varchar(160) NOT NULL,
	"createdByUserId" integer,
	"createdByLabel" varchar(160) NOT NULL,
	"isActive" "boolish" DEFAULT 'true' NOT NULL,
	"startImmediately" "boolish" DEFAULT 'false' NOT NULL,
	"nextRunAt" timestamp with time zone NOT NULL,
	"lastRunAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teamMemberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"teamId" integer NOT NULL,
	"roleLabel" varchar(80) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
