CREATE TABLE `dojo_instructors` (
	`id` varchar(64) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`dojo_id` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `dojo_instructors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instructor_invites` (
	`id` varchar(64) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(150) NOT NULL,
	`dojo_id` varchar(64) NOT NULL,
	`class_id` varchar(64),
	`token_hash` varchar(64) NOT NULL,
	`status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`invited_by` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`responded_at` timestamp,
	CONSTRAINT `instructor_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `instructor_invites_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
DROP TABLE `instructors_tbl`;--> statement-breakpoint
ALTER TABLE `classes` RENAME COLUMN `instructor` TO `instructor_id`;--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN `name` TO `firstName`;--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `id` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `instructor_id` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `level` enum('Beginner','Intermediate','Advanced') NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `status` enum('active','deleted','hide') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `classes` ADD `dojo_id` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastName` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `dojo_instructors` ADD CONSTRAINT `dojo_instructors_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dojo_instructors` ADD CONSTRAINT `dojo_instructors_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_invites` ADD CONSTRAINT `instructor_invites_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_invites` ADD CONSTRAINT `instructor_invites_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_invites` ADD CONSTRAINT `instructor_invites_invited_by_users_id_fk` FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_instructor_id_dojo_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `dojo_instructors`(`id`) ON DELETE cascade ON UPDATE no action;