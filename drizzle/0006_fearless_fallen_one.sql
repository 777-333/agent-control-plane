CREATE TABLE `swarmMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`swarmId` int NOT NULL,
	`communicationLinkId` int NOT NULL,
	`senderAgentId` int NOT NULL,
	`senderAgentName` varchar(160) NOT NULL,
	`content` text NOT NULL,
	`kind` enum('directive','status','evidence','approval') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `swarmMessages_id` PRIMARY KEY(`id`)
);
