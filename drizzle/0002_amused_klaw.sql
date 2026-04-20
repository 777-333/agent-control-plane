CREATE TABLE `approvalChains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`escalationMode` enum('serial','parallel','auto_escalate') NOT NULL DEFAULT 'serial',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvalChains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvalStages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chainId` int NOT NULL,
	`stageOrder` int NOT NULL,
	`stageName` varchar(140) NOT NULL,
	`requiredRole` varchar(100) NOT NULL,
	`defaultApproverLabel` varchar(160) NOT NULL,
	`slaMinutes` int NOT NULL DEFAULT 60,
	`escalationAfterMinutes` int NOT NULL DEFAULT 120,
	`escalationTargetLabel` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvalStages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `approvals` ADD `chainId` int;--> statement-breakpoint
ALTER TABLE `approvals` ADD `currentStageOrder` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `approvals` ADD `escalationStatus` enum('none','pending','escalated','resolved') DEFAULT 'none' NOT NULL;