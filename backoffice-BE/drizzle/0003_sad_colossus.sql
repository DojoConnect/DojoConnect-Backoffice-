CREATE TABLE `email_update_requests` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`old_email` varchar(255) NOT NULL,
	`new_email` varchar(255) NOT NULL,
	`status` enum('pending','verified','canceled','revoked') DEFAULT 'pending',
	`otp_id` varchar(36),
	`requested_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `email_update_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `otps` RENAME COLUMN `used` TO `status`;--> statement-breakpoint
ALTER TABLE `otps` RENAME COLUMN `blocked_at` TO `revoked_at`;--> statement-breakpoint
ALTER TABLE `otps` MODIFY COLUMN `type` enum('password_reset','email_verification','email_update') NOT NULL;--> statement-breakpoint
ALTER TABLE `otps` MODIFY COLUMN `status` enum('pending','used','revoked') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `email_update_requests` ADD CONSTRAINT `email_update_requests_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_update_requests` ADD CONSTRAINT `email_update_requests_otp_id_otps_id_fk` FOREIGN KEY (`otp_id`) REFERENCES `otps`(`id`) ON DELETE set null ON UPDATE no action;