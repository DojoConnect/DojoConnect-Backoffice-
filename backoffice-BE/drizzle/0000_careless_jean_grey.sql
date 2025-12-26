CREATE TABLE IF NOT EXISTS `admin` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `admin_id` PRIMARY KEY(`id`),
	CONSTRAINT `email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `admin_password_resets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`admin_email` varchar(255) NOT NULL,
	`otp` varchar(6) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `admin_password_resets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `announcement_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcement_id` int NOT NULL,
	`recipient_email` varchar(255) NOT NULL,
	CONSTRAINT `announcement_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`sender_email` varchar(255) NOT NULL,
	`urgency` varchar(50) DEFAULT 'Update',
	`created_at` datetime NOT NULL,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `attendance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`attendance_date` date NOT NULL,
	`status` enum('Present','Absent','Late') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `broadcast_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int NOT NULL,
	`recipient_id` int NOT NULL,
	CONSTRAINT `broadcast_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `chat_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`user_id` int NOT NULL,
	CONSTRAINT `chat_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `chats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('dm','group','broadcast') NOT NULL,
	`name` varchar(100),
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `children_subscription` (
	`id` int AUTO_INCREMENT NOT NULL,
	`child_id` int NOT NULL,
	`enrollment_id` varchar(50) NOT NULL,
	`stripe_subscription_id` varchar(255),
	`stripe_customer_id` varchar(255) NOT NULL,
	`status` enum('active','cancelled','paused') DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`stripe_session_id` varchar(255),
	CONSTRAINT `children_subscription_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `class_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`day` varchar(20),
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`schedule_date` date,
	CONSTRAINT `class_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `classes` (
	`id` varchar(36) NOT NULL,
	`class_uid` varchar(50) NOT NULL,
	`dojo_id` varchar(36) NOT NULL,
	`instructor_id` varchar(36) NOT NULL,
	`owner_email` varchar(255) NOT NULL,
	`class_name` varchar(255) NOT NULL,
	`description` text,
	`level` enum('Beginner','Intermediate','Advanced') NOT NULL,
	`age_group` varchar(50),
	`frequency` varchar(50),
	`capacity` int,
	`location` varchar(255),
	`street_address` varchar(255),
	`city` varchar(255),
	`status` enum('active','deleted','hide') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`image_path` varchar(255),
	`subscription` varchar(100),
	`price` decimal(10,2) DEFAULT '0.00',
	`chat_id` int,
	`stripe_price_id` varchar(255),
	`stripe_product_id` varchar(255) NOT NULL,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `class_uid` UNIQUE(`class_uid`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `deletion_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(50) NOT NULL,
	`email` varchar(255) NOT NULL,
	`reason` text,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`requested_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `deletion_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dojo_instructors` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`dojo_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `dojo_instructors_id` PRIMARY KEY(`id`),
	CONSTRAINT `dojo_instructors_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dojo_subscriptions` (
	`id` varchar(36) NOT NULL,
	`dojo_id` varchar(36) NOT NULL,
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
CREATE TABLE IF NOT EXISTS `dojos` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`tag` varchar(50) NOT NULL,
	`tagline` varchar(255) NOT NULL,
	`status` enum('registered','onboarding_incomplete','trialing','active','past_due','blocked') NOT NULL,
	`active_sub` enum('monthly','yearly') NOT NULL,
	`has_used_trial` boolean NOT NULL DEFAULT false,
	`trial_ends_at` datetime,
	`referral_code` varchar(255) NOT NULL,
	`referred_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `dojos_id` PRIMARY KEY(`id`),
	CONSTRAINT `dojos_tag_unique` UNIQUE(`tag`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `enrolled_children` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollment_id` varchar(50) NOT NULL,
	`child_name` varchar(100) NOT NULL,
	`child_email` varchar(100) NOT NULL,
	`experience_level` varchar(50) NOT NULL,
	CONSTRAINT `enrolled_children_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollment_id` varchar(50) NOT NULL,
	`class_id` varchar(50) NOT NULL,
	`parent_email` varchar(100) NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollment_id` UNIQUE(`enrollment_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`class_ids` text NOT NULL,
	`visibility` text NOT NULL,
	`event_date` date NOT NULL,
	`start_time` varchar(20) NOT NULL,
	`end_time` varchar(20) NOT NULL,
	`notification_value` int DEFAULT 0,
	`notification_unit` varchar(20),
	`location` varchar(255),
	`link` varchar(255) NOT NULL,
	`created_by` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`notification_sent` tinyint DEFAULT 0,
	`response_status` varchar(121) NOT NULL DEFAULT 'pending',
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_email` varchar(255),
	`message` text,
	`full_name` varchar(255),
	`role` varchar(100),
	`submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `instructor_invites` (
	`id` varchar(36) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(150) NOT NULL,
	`dojo_id` varchar(36) NOT NULL,
	`class_id` varchar(36),
	`token_hash` varchar(64) NOT NULL,
	`status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`invited_by` varchar(36) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`responded_at` timestamp,
	CONSTRAINT `instructor_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `instructor_invites_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`sender_id` int NOT NULL,
	`message` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `notifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(255),
	`message` text,
	`is_read` boolean DEFAULT false,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`type` enum('event','invitation_created','invitation_response','invitation_accepted','message','signup'),
	`event_id` varchar(121),
	`accept_decline` varchar(20),
	`status` varchar(20) DEFAULT 'pending',
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `parents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`enrollment_id` varchar(255) DEFAULT '',
	`class_id` varchar(255) DEFAULT '',
	CONSTRAINT `parents_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_parent_enrollment` UNIQUE(`email`,`enrollment_id`,`class_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `password_reset_otps` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`hashed_otp` varchar(255) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`expires_at` datetime NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`blocked_at` datetime,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `password_reset_otps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
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
CREATE TABLE IF NOT EXISTS `sessions` (
	`session_id` varchar(255) NOT NULL,
	`user_email` varchar(255) NOT NULL,
	`user_ip` varchar(50),
	`user_agent` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`expires_at` datetime NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`full_name` varchar(255),
	`email` varchar(255),
	`class_id` varchar(255),
	`added_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255),
	`description` text,
	`assigned_to` varchar(255),
	`created_by` varchar(255),
	`due_date` datetime,
	`notification_value` varchar(10),
	`notification_unit` varchar(10),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`status` enum('pending','in_progress','completed','declined') DEFAULT 'pending',
	`updated_at` timestamp,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_email` varchar(255) NOT NULL,
	`transaction_title` varchar(255) NOT NULL,
	`revenue` decimal(10,2) DEFAULT '0.00',
	`expenses` decimal(10,2) DEFAULT '0.00',
	`committed_by` varchar(255),
	`date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`class_id` int,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_cards` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`payment_method_id` varchar(255),
	`brand` varchar(50),
	`last4` varchar(4),
	`exp_month` int,
	`exp_year` int,
	`is_default` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_oauth_accounts` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`provider` enum('google') NOT NULL,
	`provider_user_id` varchar(255) NOT NULL,
	`profile_data` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_oauth_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_user_unique` UNIQUE(`provider`,`provider_user_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` varchar(36) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(150) NOT NULL,
	`username` varchar(100) NOT NULL,
	`password_hash` varchar(255),
	`email_verified` boolean NOT NULL DEFAULT false,
	`avatar` text,
	`role` enum('dojo-admin','instructor','parent','child') NOT NULL,
	`balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`stripe_customer_id` varchar(255),
	`dob` varchar(20),
	`gender` varchar(10),
	`city` varchar(50),
	`street` varchar(100),
	`fcm_token` text,
	`session_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullname` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `waitlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `email` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_instructor_id_dojo_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `dojo_instructors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dojo_instructors` ADD CONSTRAINT `dojo_instructors_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dojo_instructors` ADD CONSTRAINT `dojo_instructors_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dojo_subscriptions` ADD CONSTRAINT `dojo_subscriptions_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dojos` ADD CONSTRAINT `dojos_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_invites` ADD CONSTRAINT `instructor_invites_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_invites` ADD CONSTRAINT `instructor_invites_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_invites` ADD CONSTRAINT `instructor_invites_invited_by_users_id_fk` FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_otps` ADD CONSTRAINT `password_reset_otps_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_cards` ADD CONSTRAINT `user_cards_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_oauth_accounts` ADD CONSTRAINT `user_oauth_accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `announcement_id` ON `announcement_recipients` (`announcement_id`);--> statement-breakpoint
CREATE INDEX `message_id` ON `broadcast_recipients` (`message_id`);--> statement-breakpoint
CREATE INDEX `recipient_id` ON `broadcast_recipients` (`recipient_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `chat_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_participants` ON `chat_participants` (`chat_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `created_by` ON `chats` (`created_by`);--> statement-breakpoint
CREATE INDEX `class_id` ON `class_schedule` (`class_id`);--> statement-breakpoint
CREATE INDEX `enrollment_id` ON `enrolled_children` (`enrollment_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_chat_id` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_sender_id` ON `messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `user_email` ON `sessions` (`user_email`);