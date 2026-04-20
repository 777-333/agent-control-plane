ALTER TABLE `approvalStages` ADD `stageMode` enum('serial','parallel','branch') DEFAULT 'serial' NOT NULL;--> statement-breakpoint
ALTER TABLE `approvalStages` ADD `laneKey` varchar(80) DEFAULT 'main' NOT NULL;--> statement-breakpoint
ALTER TABLE `approvalStages` ADD `branchSourceStageOrder` int;--> statement-breakpoint
ALTER TABLE `approvalStages` ADD `branchLabel` varchar(120);--> statement-breakpoint
ALTER TABLE `approvalStages` ADD `branchOperator` enum('always','equals','contains','greater_than','less_than') DEFAULT 'always' NOT NULL;--> statement-breakpoint
ALTER TABLE `approvalStages` ADD `branchValue` varchar(160);