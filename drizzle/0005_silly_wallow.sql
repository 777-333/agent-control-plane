ALTER TABLE `approvalStages` ADD `quorumMode` enum('all','majority','minimum_count','distinct_roles') DEFAULT 'all' NOT NULL;
ALTER TABLE `approvalStages` ADD `quorumTarget` int DEFAULT 1 NOT NULL;
