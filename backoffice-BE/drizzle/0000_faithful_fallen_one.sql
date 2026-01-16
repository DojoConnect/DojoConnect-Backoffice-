CREATE TABLE `admin` (
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
CREATE TABLE `admin_password_resets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`admin_email` varchar(255) NOT NULL,
	`otp` varchar(6) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `admin_password_resets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcement_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcement_id` int NOT NULL,
	`recipient_email` varchar(255) NOT NULL,
	CONSTRAINT `announcement_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`sender_email` varchar(255) NOT NULL,
	`urgency` varchar(50) DEFAULT 'Update',
	`created_at` datetime NOT NULL,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`attendance_date` date NOT NULL,
	`status` enum('Present','Absent','Late') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcast_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int NOT NULL,
	`recipient_id` int NOT NULL,
	CONSTRAINT `broadcast_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`user_id` int NOT NULL,
	CONSTRAINT `chat_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('dm','group','broadcast') NOT NULL,
	`name` varchar(100),
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_enrollments` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`revoked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `class_enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_class_unique` UNIQUE(`student_id`,`class_id`)
);
--> statement-breakpoint
CREATE TABLE `class_occurrences` (
	`id` varchar(36) NOT NULL,
	`schedule_id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`date` date NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`cancellation_reason` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `class_occurrences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_schedules` (
	`id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`weekday` enum('sunday','monday','tuesday','wednesday','thursday','friday','saturday'),
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`initial_class_date` date NOT NULL,
	CONSTRAINT `class_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `time_order_check` CHECK(`class_schedules`.`start_time` < `class_schedules`.`end_time`)
);
--> statement-breakpoint
CREATE TABLE `class_subscriptions` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`stripe_customer_id` varchar(255) NOT NULL,
	`stripe_sub_id` varchar(255) NOT NULL,
	`status` enum('no_customer','customer_created','setup_intent_created','payment_method_attached','subscription_created','trialing','active','past_due','unpaid','cancelled') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`ended_at` timestamp,
	CONSTRAINT `class_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `class_subscriptions_stripe_sub_id_unique` UNIQUE(`stripe_sub_id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` varchar(36) NOT NULL,
	`dojo_id` varchar(36) NOT NULL,
	`instructor_id` varchar(36),
	`name` varchar(150) NOT NULL,
	`description` varchar(150),
	`level` enum('beginner','intermediate','advanced') NOT NULL,
	`min_age` tinyint unsigned NOT NULL,
	`max_age` tinyint unsigned NOT NULL,
	`capacity` smallint unsigned NOT NULL,
	`street_address` varchar(255) NOT NULL,
	`city` varchar(255) NOT NULL,
	`grading_date` timestamp,
	`frequency` enum('one_time','weekly') NOT NULL,
	`subscription_type` enum('free','paid') NOT NULL,
	`price` decimal(10,2) unsigned,
	`stripe_price_id` varchar(255),
	`image_public_id` varchar(255),
	`status` enum('active','deleted','hidden') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `age_range_check` CHECK(`classes`.`min_age` <= `classes`.`max_age`),
	CONSTRAINT `capacity_check` CHECK(`classes`.`capacity` > 0),
	CONSTRAINT `subscription_price_check` CHECK((`classes`.`subscription_type` = 'free' AND (`classes`.`price` IS NULL OR `classes`.`price` = 0)) OR (`classes`.`subscription_type` = 'paid' AND (`classes`.`price` IS NOT NULL AND `classes`.`price` > 0)))
);
--> statement-breakpoint
CREATE TABLE `deletion_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(50) NOT NULL,
	`email` varchar(255) NOT NULL,
	`reason` text,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`requested_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `deletion_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dojo_instructors` (
	`id` varchar(36) NOT NULL,
	`instructor_user_id` varchar(36) NOT NULL,
	`dojo_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `dojo_instructors_id` PRIMARY KEY(`id`),
	CONSTRAINT `dojo_instructors_instructor_user_id_unique` UNIQUE(`instructor_user_id`),
	CONSTRAINT `unique_dojo_instructor` UNIQUE(`dojo_id`,`instructor_user_id`)
);
--> statement-breakpoint
CREATE TABLE `dojo_subscriptions` (
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
CREATE TABLE `dojos` (
	`id` varchar(36) NOT NULL,
	`owner_user_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`tag` varchar(50) NOT NULL,
	`tagline` varchar(255) NOT NULL,
	`status` enum('registered','onboarding_incomplete','trialing','active','past_due','blocked') NOT NULL,
	`balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`active_sub` enum('monthly','yearly') NOT NULL,
	`has_used_trial` boolean NOT NULL DEFAULT false,
	`trial_ends_at` datetime,
	`referral_code` varchar(255) NOT NULL,
	`stripe_customer_id` varchar(255) NOT NULL,
	`referred_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `dojos_id` PRIMARY KEY(`id`),
	CONSTRAINT `dojos_tag_unique` UNIQUE(`tag`),
	CONSTRAINT `dojos_stripe_customer_id_unique` UNIQUE(`stripe_customer_id`)
);
--> statement-breakpoint
CREATE TABLE `enrolled_children` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollment_id` varchar(50) NOT NULL,
	`child_name` varchar(100) NOT NULL,
	`child_email` varchar(100) NOT NULL,
	`experience_level` varchar(50) NOT NULL,
	CONSTRAINT `enrolled_children_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollment_id` varchar(50) NOT NULL,
	`class_id` varchar(50) NOT NULL,
	`parent_email` varchar(100) NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollment_id` UNIQUE(`enrollment_id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
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
	`notification_sent` tinyint DEFAULT 0,
	`response_status` varchar(121) NOT NULL DEFAULT 'pending',
	`created_by` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_email` varchar(255),
	`message` text,
	`full_name` varchar(255),
	`role` varchar(100),
	`submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instructor_invites` (
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
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`sender_id` int NOT NULL,
	`message` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(255),
	`message` text,
	`is_read` boolean DEFAULT false,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`type` enum('event','child_added','class_created','class_updated','class_deleted','class_assigned','class_reassigned','invitation_created','invitation_response','invitation_accepted','message','signup'),
	`event_id` varchar(121),
	`accept_decline` varchar(20),
	`status` varchar(20) DEFAULT 'pending',
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `one_time_class_payments` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`stripe_payment_intent_id` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`status` enum('no_customer','customer_created','setup_intent_created','payment_method_attached','subscription_created','trialing','active','past_due','unpaid','cancelled') NOT NULL,
	`paid_at` timestamp,
	CONSTRAINT `one_time_class_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `one_time_class_payments_stripe_payment_intent_id_unique` UNIQUE(`stripe_payment_intent_id`)
);
--> statement-breakpoint
CREATE TABLE `parents` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`stripe_customer_id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `parents_id` PRIMARY KEY(`id`),
	CONSTRAINT `parents_stripe_customer_id_unique` UNIQUE(`stripe_customer_id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_otps` (
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
CREATE TABLE `refresh_tokens` (
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
CREATE TABLE `sessions` (
	`session_id` varchar(255) NOT NULL,
	`user_email` varchar(255) NOT NULL,
	`user_ip` varchar(50),
	`user_agent` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`expires_at` datetime NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stripe_webhook_events` (
	`id` varchar(255) NOT NULL,
	`type` varchar(100) NOT NULL,
	`processed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_webhook_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` varchar(36) NOT NULL,
	`student_user_id` varchar(36) NOT NULL,
	`parent_id` varchar(36) NOT NULL,
	`experience_level` enum('beginner','intermediate','advanced') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_student_user_id_unique` UNIQUE(`student_user_id`),
	CONSTRAINT `unique_student_parent` UNIQUE(`student_user_id`,`parent_id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255),
	`description` text,
	`assigned_to` varchar(255),
	`created_by` varchar(255),
	`due_date` datetime,
	`notification_value` varchar(10),
	`notification_unit` varchar(10),
	`status` enum('pending','in_progress','completed','declined') DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
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
CREATE TABLE `user_cards` (
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
CREATE TABLE `user_oauth_accounts` (
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
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(150) NOT NULL,
	`username` varchar(100) NOT NULL,
	`password_hash` varchar(255),
	`email_verified` boolean NOT NULL DEFAULT false,
	`avatar` text,
	`role` enum('dojo-admin','instructor','parent','child') NOT NULL,
	`dob` date,
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
CREATE TABLE `waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullname` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `waitlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `email` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_occurrences` ADD CONSTRAINT `class_occurrences_schedule_id_class_schedules_id_fk` FOREIGN KEY (`schedule_id`) REFERENCES `class_schedules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_occurrences` ADD CONSTRAINT `class_occurrences_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_schedules` ADD CONSTRAINT `class_schedules_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_subscriptions` ADD CONSTRAINT `class_subscriptions_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_subscriptions` ADD CONSTRAINT `class_subscriptions_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_instructor_id_dojo_instructors_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `dojo_instructors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dojo_instructors` ADD CONSTRAINT `dojo_instructors_instructor_user_id_users_id_fk` FOREIGN KEY (`instructor_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dojo_instructors` ADD CONSTRAINT `dojo_instructors_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dojo_subscriptions` ADD CONSTRAINT `dojo_subscriptions_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dojos` ADD CONSTRAINT `dojos_owner_user_id_users_id_fk` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_invites` ADD CONSTRAINT `instructor_invites_dojo_id_dojos_id_fk` FOREIGN KEY (`dojo_id`) REFERENCES `dojos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_invites` ADD CONSTRAINT `instructor_invites_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instructor_invites` ADD CONSTRAINT `instructor_invites_invited_by_users_id_fk` FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `one_time_class_payments` ADD CONSTRAINT `one_time_class_payments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `one_time_class_payments` ADD CONSTRAINT `one_time_class_payments_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parents` ADD CONSTRAINT `parents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_otps` ADD CONSTRAINT `password_reset_otps_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_student_user_id_users_id_fk` FOREIGN KEY (`student_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_cards` ADD CONSTRAINT `user_cards_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_oauth_accounts` ADD CONSTRAINT `user_oauth_accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `announcement_id` ON `announcement_recipients` (`announcement_id`);--> statement-breakpoint
CREATE INDEX `message_id` ON `broadcast_recipients` (`message_id`);--> statement-breakpoint
CREATE INDEX `recipient_id` ON `broadcast_recipients` (`recipient_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `chat_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_participants` ON `chat_participants` (`chat_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `created_by` ON `chats` (`created_by`);--> statement-breakpoint
CREATE INDEX `class_idx` ON `class_schedules` (`class_id`);--> statement-breakpoint
CREATE INDEX `instructor_idx` ON `classes` (`instructor_id`);--> statement-breakpoint
CREATE INDEX `dojo_idx` ON `classes` (`dojo_id`);--> statement-breakpoint
CREATE INDEX `dojo_id` ON `dojo_instructors` (`dojo_id`);--> statement-breakpoint
CREATE INDEX `instructor_user_id` ON `dojo_instructors` (`instructor_user_id`);--> statement-breakpoint
CREATE INDEX `enrollment_id` ON `enrolled_children` (`enrollment_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_chat_id` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_sender_id` ON `messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `user_email` ON `sessions` (`user_email`);