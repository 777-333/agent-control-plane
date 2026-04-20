CREATE TABLE `agentActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`connectorId` int,
	`actionType` varchar(140) NOT NULL,
	`status` enum('executed','blocked','pending_approval','failed') NOT NULL,
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`estimatedCostUsd` decimal(10,2) NOT NULL DEFAULT '0.00',
	`tokenUsage` int NOT NULL DEFAULT 0,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agentConnectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`connectorId` int NOT NULL,
	`permissionScope` varchar(120) NOT NULL,
	`mode` enum('read','write','approve') NOT NULL DEFAULT 'read',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentConnectors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agentPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`subjectType` enum('user','team') NOT NULL,
	`subjectRef` varchar(80) NOT NULL,
	`permissionLevel` enum('viewer','operator','approver','admin') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentPermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(140) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`description` text,
	`status` enum('healthy','warning','paused','offline') NOT NULL DEFAULT 'healthy',
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`ownerUserId` int,
	`teamId` int,
	`model` varchar(160) NOT NULL,
	`environment` enum('production','staging','development') NOT NULL DEFAULT 'production',
	`policyMode` enum('enforced','monitoring','disabled') NOT NULL DEFAULT 'enforced',
	`lastHeartbeatAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`actionId` int NOT NULL,
	`status` enum('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
	`requestedByUserId` int,
	`approverUserId` int,
	`summary` text NOT NULL,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int,
	`actionId` int,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`category` varchar(100) NOT NULL,
	`title` varchar(180) NOT NULL,
	`detail` text NOT NULL,
	`actorType` enum('agent','user','system') NOT NULL DEFAULT 'system',
	`actorRef` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`type` enum('CRM','ERP','E-Mail','Browser','Datenbank') NOT NULL,
	`status` enum('connected','degraded','disconnected') NOT NULL DEFAULT 'connected',
	`endpointLabel` varchar(160) NOT NULL,
	`authMode` varchar(64) NOT NULL,
	`lastSyncAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `connectors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluationCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`expectedOutcome` text NOT NULL,
	`actualOutcome` text NOT NULL,
	`status` enum('passed','failed','warning') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluationCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`status` enum('draft','running','passed','failed') NOT NULL DEFAULT 'draft',
	`score` int NOT NULL DEFAULT 0,
	`policyPassRate` int NOT NULL DEFAULT 0,
	`summary` text NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guardrailEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`actionId` int,
	`triggerType` enum('policy_violation','cost_threshold','tool_anomaly','latency_spike') NOT NULL,
	`status` enum('monitoring','stopped','resolved') NOT NULL DEFAULT 'monitoring',
	`thresholdLabel` varchar(160) NOT NULL,
	`detail` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guardrailEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metricSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int,
	`latencyMs` int NOT NULL DEFAULT 0,
	`errorRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`apiCostUsd` decimal(10,2) NOT NULL DEFAULT '0.00',
	`tokenUsage` int NOT NULL DEFAULT 0,
	`windowLabel` varchar(40) NOT NULL,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metricSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(140) NOT NULL,
	`scopeType` enum('agent','team','connector','global') NOT NULL DEFAULT 'agent',
	`scopeRef` varchar(140) NOT NULL,
	`actionPattern` varchar(180) NOT NULL,
	`effect` enum('allowed','forbidden','approval_required') NOT NULL,
	`priority` int NOT NULL DEFAULT 100,
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamMemberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`teamId` int NOT NULL,
	`roleLabel` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamMemberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`),
	CONSTRAINT `teams_slug_unique` UNIQUE(`slug`)
);
