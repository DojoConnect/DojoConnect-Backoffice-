ALTER TABLE `messages` RENAME COLUMN `message` TO `content`;--> statement-breakpoint
DROP INDEX `idx_chat_participants` ON `chat_participants`;--> statement-breakpoint
ALTER TABLE `chat_participants` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_participants` MODIFY COLUMN `chat_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_participants` MODIFY COLUMN `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `chats` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `chats` MODIFY COLUMN `type` enum('dm','class_group','broadcast') NOT NULL;--> statement-breakpoint
ALTER TABLE `chats` MODIFY COLUMN `created_by` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `chat_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `sender_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_participants` ADD `joined_at` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_participants` ADD `left_at` timestamp;--> statement-breakpoint
ALTER TABLE `classes` ADD `chat_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_participants` ADD CONSTRAINT `unique_idx_chat_id_user_id` UNIQUE(`chat_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `chat_participants` ADD CONSTRAINT `chat_participants_chat_id_chats_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_participants` ADD CONSTRAINT `chat_participants_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chats` ADD CONSTRAINT `chats_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_chat_id_chats_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_chat_id_chats_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_messages_chat_id_created_at` ON `messages` (`chat_id`,`created_at`);