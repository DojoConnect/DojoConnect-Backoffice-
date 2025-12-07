CREATE TABLE `refresh_tokens` (
	`id` varchar(64) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`hashed_token` varchar(255) NOT NULL,
	`user_ip` varchar(50),
	`user_agent` text,
	`revoked` boolean DEFAULT false,
	`expires_at` datetime NOT NULL,
	`last_used_at` datetime,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN `password` TO `password_hash`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `email_2`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `email_3`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `uc_users_email`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `password_hash` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;