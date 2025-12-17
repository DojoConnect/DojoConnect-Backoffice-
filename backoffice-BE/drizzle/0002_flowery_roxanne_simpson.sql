CREATE TABLE `password_reset_otps` (
	`id` varchar(64) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`hashed_otp` varchar(255) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`expires_at` datetime NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`blocked_at` datetime,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `password_reset_otps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `password_resets`;--> statement-breakpoint
ALTER TABLE `password_reset_otps` ADD CONSTRAINT `password_reset_otps_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;