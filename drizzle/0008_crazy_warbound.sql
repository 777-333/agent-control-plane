CREATE TABLE `swarmAutonomyEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`swarmId` int NOT NULL,
	`stepId` int,
	`eventType` enum('planned','delegated','feedback','governance','paused','resumed','cancelled','completed','failed') NOT NULL,
	`actorLabel` varchar(160) NOT NULL,
	`detail` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `swarmAutonomyEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `swarmAutonomyRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`swarmId` int NOT NULL,
	`objective` text NOT NULL,
	`context` text,
	`priority` enum('standard','urgent','critical') NOT NULL DEFAULT 'standard',
	`status` enum('planned','running','awaiting_approval','blocked','paused','completed','cancelled','failed') NOT NULL DEFAULT 'planned',
	`governanceStatus` enum('clear','approval_required','blocked') NOT NULL DEFAULT 'clear',
	`requestedByUserId` int,
	`requestedByLabel` varchar(160) NOT NULL,
	`requestedByRole` enum('user','admin','system') NOT NULL DEFAULT 'user',
	`summary` text NOT NULL,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`lastEventAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `swarmAutonomyRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `swarmAutonomySteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`swarmId` int NOT NULL,
	`assignedAgentId` int NOT NULL,
	`assignedAgentName` varchar(160) NOT NULL,
	`title` varchar(180) NOT NULL,
	`instructions` text NOT NULL,
	`status` enum('pending','in_progress','completed','blocked','awaiting_input','skipped','cancelled') NOT NULL DEFAULT 'pending',
	`sequence` int NOT NULL,
	`dependsOnStepId` int,
	`output` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `swarmAutonomySteps_id` PRIMARY KEY(`id`)
);
