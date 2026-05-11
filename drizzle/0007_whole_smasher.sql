CREATE TABLE `swarmReportDownloadApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`swarmId` int NOT NULL,
	`format` enum('csv','pdf') NOT NULL,
	`requestStatus` enum('pending','approved','rejected','consumed') NOT NULL DEFAULT 'pending',
	`requiredRoleLabel` varchar(160) NOT NULL,
	`requestedByUserId` int,
	`requestedByLabel` varchar(160) NOT NULL,
	`requestedBySystemRole` enum('user','admin') NOT NULL DEFAULT 'user',
	`approvedByUserId` int,
	`approvedByLabel` varchar(160),
	`reason` text NOT NULL,
	`exportWindowHours` int NOT NULL DEFAULT 24,
	`sensitivityLabel` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`consumedAt` timestamp,
	CONSTRAINT `swarmReportDownloadApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `swarmReportExports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`swarmId` int NOT NULL,
	`format` enum('csv','pdf') NOT NULL,
	`triggerSource` enum('manual','approval','subscription') NOT NULL DEFAULT 'manual',
	`triggeredByUserId` int,
	`triggeredByLabel` varchar(160) NOT NULL,
	`requesterRole` enum('user','admin','system') NOT NULL DEFAULT 'user',
	`reportWindowHours` int NOT NULL DEFAULT 24,
	`communicationLinkCount` int NOT NULL DEFAULT 0,
	`approvalMessageCount` int NOT NULL DEFAULT 0,
	`overdueLinkCount` int NOT NULL DEFAULT 0,
	`averageResponseMinutes` int NOT NULL DEFAULT 0,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `swarmReportExports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `swarmReportSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`swarmId` int NOT NULL,
	`cadence` enum('daily','weekly','monthly') NOT NULL,
	`format` enum('csv','pdf') NOT NULL,
	`recipientRoleLabel` varchar(160) NOT NULL,
	`createdByUserId` int,
	`createdByLabel` varchar(160) NOT NULL,
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`startImmediately` enum('true','false') NOT NULL DEFAULT 'false',
	`nextRunAt` timestamp NOT NULL,
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `swarmReportSubscriptions_id` PRIMARY KEY(`id`)
);
