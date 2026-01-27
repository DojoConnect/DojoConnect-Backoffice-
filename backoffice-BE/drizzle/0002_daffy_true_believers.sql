RENAME TABLE `password_reset_otps` TO `otps`;--> statement-breakpoint
ALTER TABLE `otps` DROP FOREIGN KEY `password_reset_otps_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `otps` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `admin` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_password_resets` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `announcement_recipients` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `announcements` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance_records` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `broadcast_recipients` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `deletion_requests` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `enrolled_children` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `feedback` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `one_time_class_payments` MODIFY COLUMN `stripe_payment_intent_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `waitlist` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `otps` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `otps` ADD `type` enum('password_reset','email_verification') NOT NULL;--> statement-breakpoint
ALTER TABLE `otps` ADD CONSTRAINT `otps_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_id` ON `otps` (`user_id`);