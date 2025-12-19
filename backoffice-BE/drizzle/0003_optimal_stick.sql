CREATE TABLE `dojo_subscriptions` (
	`id` varchar(64) NOT NULL,
	`dojo_id` varchar(64) NOT NULL,
	`billing_status` enum('no_customer','customer_created','setup_intent_created','payment_method_attached','subscription_created','trialing','active','past_due','unpaid','cancelled') NOT NULL,
	`stripe_sub_id` varchar(255),
	`stripe_setup_intent_id` varchar(255),
	`strip_sub_status` enum('incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid','paused'),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`active_dojo_id` varchar(36) GENERATED ALWAYS AS (
        CASE
          WHEN billing_status IN ('trialing', 'active', 'past_due')
          THEN dojo_id
          ELSE NULL
        END
      ) VIRTUAL,
	CONSTRAINT `dojo_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `dojo_subscriptions_stripe_sub_id_unique` UNIQUE(`stripe_sub_id`),
	CONSTRAINT `one_active_subscription_per_user` UNIQUE(`active_dojo_id`)
);
--> statement-breakpoint
ALTER TABLE `dojos` DROP INDEX `tag`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `email`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `username`;--> statement-breakpoint
ALTER TABLE `dojos` ADD `status` enum('registered','onboarding_incomplete','trialing','active','past_due','blocked') NOT NULL;--> statement-breakpoint
ALTER TABLE `dojos` ADD `active_sub` enum('monthly','yearly') NOT NULL;--> statement-breakpoint
ALTER TABLE `dojos` ADD `has_used_trial` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `dojos` ADD `trial_ends_at` datetime;--> statement-breakpoint
ALTER TABLE `dojos` ADD CONSTRAINT `dojos_tag_unique` UNIQUE(`tag`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `dojo_subscriptions` ADD CONSTRAINT `dojo_subscriptions_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `active_sub`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `stripe_subscription_id`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `subscription_status`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `trial_ends_at`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `stripe_account_id`;