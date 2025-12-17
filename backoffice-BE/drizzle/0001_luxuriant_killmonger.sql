CREATE TABLE `user_oauth_accounts` (
	`id` varchar(64) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`provider` enum('google') NOT NULL,
	`provider_user_id` varchar(255) NOT NULL,
	`profile_data` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_oauth_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_user_unique` UNIQUE(`provider`,`provider_user_id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `password_hash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_oauth_accounts` ADD CONSTRAINT `user_oauth_accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;