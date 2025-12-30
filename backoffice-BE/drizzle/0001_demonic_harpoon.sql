CREATE TABLE `class_occurrences` (
	`id` varchar(36) NOT NULL,
	`schedule_id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`date` date NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`cancellation_reason` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `class_occurrences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_schedules` (
	`id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`weekday` enum('sunday','monday','tuesday','wednesday','thursday','friday','saturday'),
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`initial_class_date` date NOT NULL,
	CONSTRAINT `class_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `time_order_check` CHECK(`class_schedules`.`start_time` < `class_schedules`.`end_time`)
);
--> statement-breakpoint
DROP TABLE `class_schedule`;--> statement-breakpoint
ALTER TABLE `classes` DROP INDEX `class_uid`;--> statement-breakpoint
ALTER TABLE `classes` DROP FOREIGN KEY `classes_instructor_id_dojo_instructors_id_fk`;
--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `instructor_id` varchar(36);--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `description` varchar(150);--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `level` enum('beginner','intermediate','advanced') NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `frequency` enum('one_time','weekly') NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `capacity` smallint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `street_address` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `city` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `status` enum('active','deleted','hidden') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `price` decimal(10,2) unsigned;--> statement-breakpoint
ALTER TABLE `classes` ADD `name` varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` ADD `min_age` tinyint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` ADD `max_age` tinyint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` ADD `grading_date` timestamp;--> statement-breakpoint
ALTER TABLE `classes` ADD `subscription_type` enum('free','paid') NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` ADD `image_public_id` varchar(255);--> statement-breakpoint
ALTER TABLE `class_occurrences` ADD CONSTRAINT `class_occurrences_schedule_id_class_schedules_id_fk` FOREIGN KEY (`schedule_id`) REFERENCES `class_schedules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_occurrences` ADD CONSTRAINT `class_occurrences_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_schedules` ADD CONSTRAINT `class_schedules_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `class_idx` ON `class_schedules` (`class_id`);--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `age_range_check` CHECK (`classes`.`min_age` <= `classes`.`max_age`);--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `capacity_check` CHECK (`classes`.`capacity` > 0);--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `subscription_price_check` CHECK ((`classes`.`subscription_type` = 'free' AND (`classes`.`price` IS NULL OR `classes`.`price` = 0)) OR (`classes`.`subscription_type` = 'paid' AND `classes`.`price` > 0));--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_instructor_id_dojo_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `dojo_instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `instructor_idx` ON `classes` (`instructor_id`);--> statement-breakpoint
CREATE INDEX `dojo_idx` ON `classes` (`dojo_id`);--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `class_uid`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `owner_email`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `class_name`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `age_group`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `location`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `image_path`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `subscription`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `chat_id`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `stripe_price_id`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `stripe_product_id`;