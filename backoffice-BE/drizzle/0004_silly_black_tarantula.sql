ALTER TABLE `users` RENAME COLUMN `avatar` TO `avatar_public_id`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `avatar_public_id` varchar(255);