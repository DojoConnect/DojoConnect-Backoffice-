ALTER TABLE `notifications` MODIFY COLUMN `type` enum('event','invitation_created','invitation_response','invitation_accepted','message','signup');--> statement-breakpoint
ALTER TABLE `dojos` ADD `referral_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `dojos` ADD `referred_by` varchar(255);--> statement-breakpoint
ALTER TABLE `dojo_instructors` ADD CONSTRAINT `dojo_instructors_user_id_unique` UNIQUE(`user_id`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `referred_by`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `referral_code`;