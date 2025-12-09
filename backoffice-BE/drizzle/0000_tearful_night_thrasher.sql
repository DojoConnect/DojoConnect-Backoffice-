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
CREATE TABLE `children_subscription` (
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
CREATE TABLE `class_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`day` varchar(20),
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`schedule_date` date,
	CONSTRAINT `class_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_uid` varchar(50) NOT NULL,
	`owner_email` varchar(255) NOT NULL,
	`class_name` varchar(255) NOT NULL,
	`description` text,
	`instructor` varchar(255),
	`level` enum('Beginner','Intermediate','Advanced'),
	`age_group` varchar(50),
	`frequency` varchar(50),
	`capacity` int,
	`location` varchar(255),
	`street_address` varchar(255),
	`city` varchar(255),
	`status` enum('active','deleted','hide') DEFAULT 'active',
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
CREATE TABLE `dojos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_email` varchar(150) NOT NULL,
	`dojo_name` varchar(255) NOT NULL,
	`dojo_tag` varchar(50) NOT NULL,
	`dojo_tagline` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `dojos_id` PRIMARY KEY(`id`),
	CONSTRAINT `tag` UNIQUE(`dojo_tag`)
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
	`created_by` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`notification_sent` tinyint DEFAULT 0,
	`response_status` varchar(121) NOT NULL DEFAULT 'pending',
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
CREATE TABLE `instructors_tbl` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instructor_first_name` varchar(50),
	`instructor_last_name` varchar(50),
	`instructor_email` varchar(100),
	`invited_by` varchar(121) NOT NULL,
	`class` varchar(100),
	`status` varchar(121) NOT NULL DEFAULT 'pending',
	CONSTRAINT `instructors_tbl_id` PRIMARY KEY(`id`)
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
	`id` int AUTO_INCREMENT NOT NULL,
	`user_email` varchar(255),
	`title` varchar(255),
	`message` text,
	`is_read` tinyint DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`type` varchar(50),
	`event_id` varchar(121),
	`accept_decline` varchar(20),
	`status` varchar(20) DEFAULT 'pending',
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`enrollment_id` varchar(255) DEFAULT '',
	`class_id` varchar(255) DEFAULT '',
	CONSTRAINT `parents_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_parent_enrollment` UNIQUE(`email`,`enrollment_id`,`class_id`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`email` varchar(255) NOT NULL,
	`token` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL
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
CREATE TABLE `students` (
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
CREATE TABLE `tasks` (
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
	`id` int AUTO_INCREMENT NOT NULL,
	`user_email` varchar(255),
	`payment_method_id` varchar(255),
	`brand` varchar(50),
	`last4` varchar(4),
	`exp_month` varchar(2),
	`exp_year` varchar(4),
	`is_default` tinyint DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`username` varchar(100),
	`email` varchar(150) NOT NULL,
	`password` varchar(255),
	`referred_by` varchar(255),
	`avatar` text,
	`role` enum('admin','instructor','parent','child') DEFAULT 'child',
	`balance` decimal(10,2) DEFAULT '0.00',
	`referral_code` varchar(255),
	`active_sub` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`dob` varchar(20),
	`gender` varchar(10),
	`city` varchar(50),
	`street` varchar(100),
	`stripe_customer_id` varchar(255),
	`stripe_subscription_id` varchar(255),
	`subscription_status` varchar(50),
	`trial_ends_at` datetime,
	`stripe_account_id` varchar(255) NOT NULL,
	`fcm_token` text,
	`session_id` varchar(255),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `email` UNIQUE(`email`),
	CONSTRAINT `email_2` UNIQUE(`email`),
	CONSTRAINT `email_3` UNIQUE(`email`),
	CONSTRAINT `uc_users_email` UNIQUE(`email`),
	CONSTRAINT `username` UNIQUE(`username`)
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