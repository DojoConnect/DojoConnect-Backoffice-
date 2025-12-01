-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 01, 2025 at 06:11 AM
-- Server version: 11.4.8-MariaDB-cll-lve
-- PHP Version: 8.3.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dojoburz_trial`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `sender_email` varchar(255) NOT NULL,
  `urgency` varchar(50) DEFAULT 'Update',
  `created_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcement_recipients`
--

CREATE TABLE `announcement_recipients` (
  `id` int(11) NOT NULL,
  `announcement_id` int(11) NOT NULL,
  `recipient_email` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_records`
--

CREATE TABLE `attendance_records` (
  `id` int(11) NOT NULL,
  `class_id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('Present','Absent','Late') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `broadcast_recipients`
--

CREATE TABLE `broadcast_recipients` (
  `id` int(11) NOT NULL,
  `message_id` int(11) NOT NULL,
  `recipient_id` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE `chats` (
  `id` int(11) NOT NULL,
  `type` enum('dm','group','broadcast') NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `chats`
--

INSERT INTO `chats` (`id`, `type`, `name`, `created_by`, `created_at`) VALUES
(1, 'group', 'Class: Danger Zone', 2, '2025-08-26 11:10:14'),
(2, 'group', 'Class: Kung Fu', 2, '2025-08-26 11:32:18');

-- --------------------------------------------------------

--
-- Table structure for table `chat_participants`
--

CREATE TABLE `chat_participants` (
  `id` int(11) NOT NULL,
  `chat_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `chat_participants`
--

INSERT INTO `chat_participants` (`id`, `chat_id`, `user_id`) VALUES
(1, 1, 2),
(2, 2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `children_subscription`
--

CREATE TABLE `children_subscription` (
  `id` int(11) NOT NULL,
  `child_id` int(11) NOT NULL,
  `enrollment_id` varchar(50) NOT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `stripe_customer_id` varchar(255) NOT NULL,
  `status` enum('active','cancelled','paused') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `stripe_session_id` varchar(255) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` int(11) NOT NULL,
  `class_uid` varchar(50) NOT NULL,
  `owner_email` varchar(255) NOT NULL,
  `class_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `instructor` varchar(255) DEFAULT NULL,
  `level` enum('Beginner','Intermediate','Advanced') DEFAULT NULL,
  `age_group` varchar(50) DEFAULT NULL,
  `frequency` varchar(50) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `street_address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `status` enum('active','deleted','hide') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `image_path` varchar(255) DEFAULT NULL,
  `subscription` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `chat_id` int(11) DEFAULT NULL,
  `stripe_price_id` varchar(255) DEFAULT NULL,
  `stripe_product_id` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `class_uid`, `owner_email`, `class_name`, `description`, `instructor`, `level`, `age_group`, `frequency`, `capacity`, `location`, `street_address`, `city`, `status`, `created_at`, `updated_at`, `image_path`, `subscription`, `price`, `chat_id`, `stripe_price_id`, `stripe_product_id`) VALUES
(1, 'e133f0c431', 'hemmanueldami@gmail.com', 'Danger Zone', 'Some information are just being added', '', 'Beginner', '10', 'Weekly', 100, 'Ajah, Lagos', NULL, NULL, 'active', '2025-08-26 11:10:13', '2025-08-26 11:10:14', 'uploads/class_e133f0c431.jpg', 'Payment / £50', 50.00, 1, 'price_1S0KlWRbZzajfaIIGUI0mIqA', ''),
(2, '034f176e8f', 'hemmanueldami@gmail.com', 'Kung Fu', 'Damilare', '', 'Beginner', '', 'One time', 200, 'Ajah, Lagos', NULL, NULL, 'active', '2025-08-26 11:32:18', '2025-08-26 11:32:18', 'uploads/class_034f176e8f.jpg', 'Payment / £200', 200.00, 2, NULL, '');

-- --------------------------------------------------------

--
-- Table structure for table `class_schedule`
--

CREATE TABLE `class_schedule` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `day` varchar(20) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `schedule_date` date DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `class_schedule`
--

INSERT INTO `class_schedule` (`id`, `class_id`, `day`, `start_time`, `end_time`, `schedule_date`) VALUES
(1, 1, 'Monday', '09:00:00', '10:00:00', NULL),
(2, 1, 'Tuesday', '12:09:00', '03:27:00', NULL),
(3, 2, '', '18:30:00', '20:30:00', '2025-08-30');

-- --------------------------------------------------------

--
-- Table structure for table `consultation_requests`
--

CREATE TABLE `consultation_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `parent_name` varchar(255) NOT NULL,
  `email_address` varchar(255) NOT NULL,
  `contact_details` varchar(100) NOT NULL,
  `reason_for_consultation` text DEFAULT NULL,
  `preferred_contact_method` varchar(50) DEFAULT NULL,
  `preferred_time_range` varchar(50) DEFAULT NULL,
  `number_of_children` int(11) DEFAULT NULL,
  `additional_notes` text DEFAULT NULL,
  `consent_acknowledged` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `appointment_type` varchar(50) NOT NULL DEFAULT 'Online',
  `status` enum('pending','upcoming','completed') DEFAULT 'pending',
  `dojo_id` int(11) DEFAULT NULL,
  `dojo_email` varchar(255) NOT NULL,
  `dojo_tag` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `consultation_requests`
--

INSERT INTO `consultation_requests` (`id`, `parent_name`, `email_address`, `contact_details`, `reason_for_consultation`, `preferred_contact_method`, `preferred_time_range`, `number_of_children`, `additional_notes`, `consent_acknowledged`, `created_at`, `appointment_type`, `status`, `dojo_id`, `dojo_email`, `dojo_tag`) VALUES
(1, 'James Carter', 'james.carter@example.com', '+1 202-555-0198', 'Looking for after-school program options', 'Phone', 'Afternoon', 2, 'Prefer weekends if possible', 1, '2025-08-22 16:11:06', 'Online', 'pending', NULL, '', ''),
(2, 'Jane Doe', 'janedoe@example.com', '+1-555-987-6543', 'Interested in booking a trial class', 'WhatsApp', 'Afternoon', 1, 'Prefer weekends if possible', 1, '2025-08-22 16:22:11', 'Online', 'pending', NULL, '', ''),
(3, 'Jane Doe', 'janedoe@example.com', '+1-555-987-6543', 'Interested in booking a trial class', 'WhatsApp', 'Afternoon', 1, 'Prefer weekends if possible', 1, '2025-08-22 16:22:36', 'online', 'pending', NULL, '', ''),
(4, 'ss', 'ss@s.com', '838383838833', 'Questions about enrollment', 'Email', 'Afternoon', 12, 'ddd', 1, '2025-08-22 16:26:48', 'online', 'pending', NULL, '', ''),
(5, 'dd', 'aa@a.com', '11222222', 'Schedule & availability', 'Email', 'Evening', 111, 'deee', 1, '2025-08-22 16:29:45', 'online', 'pending', NULL, '', ''),
(6, 'ss', 's@s.com', '11', 'Fees & plans', 'WhatsApp', 'Morning', 11, 's', 1, '2025-08-22 16:32:28', 'online', 'pending', NULL, '', ''),
(7, 'd', 'dd@s.com', '111', 'Schedule & availability', 'Email', 'Afternoon', 1, 's', 1, '2025-08-22 16:33:21', 'online', 'pending', NULL, '', ''),
(8, 'John Doe', 'john@example.com', '555-1234', 'Looking for math tutoring', 'Email', 'Afternoon', 2, 'None', 1, '2025-09-03 08:35:23', 'Online', 'pending', 1, '', ''),
(9, 'John Doe', 'john@example.com', '555-1234', 'Looking for math tutoring', 'Email', 'morning', 2, 'None', 1, '2025-09-03 08:35:32', 'Online', 'pending', 1, '', ''),
(10, 'John Doe', 'john@example.com', '555-1234', 'Looking for math tutoring', 'Email', 'evening', 2, 'None', 1, '2025-09-03 08:36:13', 'Online', 'pending', 1, '', ''),
(11, 'Maria Wade', 'maria@example.com', '554-291-1292', 'Looking to introduce all my sons to your dojo', 'Whatsapp', 'morning', 2, 'When we meet, nothing to say', 1, '2025-09-03 16:24:02', 'Online', 'pending', 1, '', ''),
(12, 'Ade wale', 'nd@djd.com', '7373737373', 'Fees & plans', 'Email', 'Afternoon', 20, 'kfjkfjkf', 1, '2025-09-09 08:43:18', 'Physical', 'pending', 5, '', ''),
(13, 'John Doe', 'johndoe@example.com', '+1234567890', 'Interested in enrolling my child in trial classes', 'Email', 'Afternoon', 1, 'Child is 8 years old and beginner level', 1, '2025-09-09 08:51:36', 'Online', 'pending', 5, '', ''),
(14, 'John Doe', 'johndoe@example.com', '+1234567890', 'Interested in enrolling my child in trial classes', 'Email', 'Afternoon', 1, 'Child is 8 years old and beginner level', 1, '2025-09-09 08:51:51', 'Online', 'pending', 5, '', ''),
(15, 'John Doe', 'johndoe@example.com', '+1234567890', 'Interested in enrolling my child in trial classes', 'Email', 'Afternoon', 1, 'Child is 8 years old and beginner level', 1, '2025-09-09 08:51:53', 'Online', 'pending', 5, '', ''),
(16, 'John Doe', 'johndoe@example.com', '+1234567890', 'Interested in enrolling my child in trial classes', 'Email', 'Afternoon', 1, 'Child is 8 years old and beginner level', 1, '2025-09-09 08:52:18', 'Online', 'pending', 5, '', ''),
(17, 'Jane Doe', 'janedoe@example.com', '+1-555-987-6543', 'Interested in booking a trial class', 'WhatsApp', 'Afternoon', 1, 'Prefer weekends if possible', 1, '2025-09-09 08:53:00', 'Online', 'pending', 5, '', ''),
(18, 'kdkds', 'hjd@s.com', '983838383', 'Questions about enrollment', 'Email', 'Afternoon', 11, 'vfff', 1, '2025-09-09 09:03:49', 'Online', 'upcoming', 6, '', ''),
(19, 'Mercy Light', 'mercry@fjf.com', '73636363633', 'Fees & plans', 'Email', 'Evening', 129, 'norhing', 1, '2025-09-09 10:07:47', 'Physical', 'upcoming', 6, '', ''),
(20, 'hffhj', 'jdj@kdf.com', '8283828282', 'Schedule & availability', 'Email', 'Afternoon', 233, 'cccc', 1, '2025-09-09 10:29:03', 'Physical', 'pending', 6, '', ''),
(21, 'akskd jdjd', 'jdj@dkd.com', '928w88383', 'Questions about enrollment', 'Email', 'Afternoon', 7347, 'kfkof', 1, '2025-09-09 10:40:15', 'Physical', 'pending', NULL, 'ade@example.com', 'ade_dojo'),
(22, 'akskd jdjd', 'jdj@dkd.com', '928w88383', 'Questions about enrollment', 'Email', 'Afternoon', 7347, 'kfkof', 1, '2025-09-09 10:40:17', 'Physical', 'pending', NULL, 'ade@example.com', 'ade_dojo'),
(23, 'akskd jdjd', 'jdj@dkd.com', '928w88383', 'Questions about enrollment', 'Email', 'Afternoon', 7347, 'kfkof', 1, '2025-09-09 10:40:50', 'Physical', 'pending', NULL, 'ade@example.com', 'ade_dojo'),
(24, 'akskd jdjd', 'jdj@dkd.com', '928w88383', 'Questions about enrollment', 'Email', 'Afternoon', 7347, 'kfkof', 1, '2025-09-09 10:40:51', 'Physical', 'pending', NULL, 'ade@example.com', 'ade_dojo'),
(25, 'akskd jdjd', 'jdj@dkd.com', '928w88383', 'Questions about enrollment', 'Email', 'Afternoon', 7347, 'kfkof', 1, '2025-09-09 10:40:59', 'Physical', 'pending', NULL, 'ade@example.com', 'ade_dojo'),
(26, 'ndjd jdjke', 'kek@jdj.com', '928383e838833', 'Questions about enrollment', 'Email', 'Afternoon', 838, 'ffff', 1, '2025-09-09 10:43:16', 'Online', 'upcoming', NULL, 'ade@example.com', 'ade_dojo'),
(27, 'jdjd jdike', 'idi@kd.com', '8378383ndnd', 'Questions about enrollment', 'Email', 'Afternoon', 22, 'fff', 1, '2025-09-09 10:49:06', 'Physical', 'upcoming', NULL, 'des@example.com', 'desmond_dojo'),
(28, 'dd', 'dd@c.oc', '44727222662', 'Questions about enrollment', 'Email', 'Afternoon', 0, 'dddd', 1, '2025-09-11 22:15:20', 'Online', 'pending', NULL, 'des@example.com', 'desmond_dojo'),
(29, 'Ismail sherifat Omotola', 'sherifatomotola2018@gmail.com', '234768090087987', 'Questions about enrollment', 'Email', 'Afternoon', 4, 'I want to enroll them ass soon as possible', 1, '2025-09-14 23:07:20', 'Physical', 'pending', NULL, 'des@example.com', 'desmond_dojo'),
(30, 'July juls', 'abidemisherry5@gmaial.com', '447809653980', 'Fees & plans', 'Phone', 'Morning', 7, 'I prefer to be contacted via my phone number', 1, '2025-09-14 23:09:38', 'Online', 'pending', NULL, 'des@example.com', 'desmond_dojo'),
(31, 'John Doe', 'ikechukwuezeagwu@gmail.com', '2348067436847', 'Questions about enrollment', 'Email', 'Morning', 1, 'Yeah yeah', 1, '2025-09-29 10:16:30', 'Physical', 'pending', NULL, 'des@example.com', 'desmond_dojo'),
(32, 'John Doe', 'ofiligadi@gmail.com', '440000000000', 'Questions about enrollment', 'Email', 'Afternoon', 2, 'My children are 7 years old', 1, '2025-09-29 11:40:41', 'Physical', 'upcoming', NULL, 'des@example.com', 'desmond_dojo'),
(33, 'John smith', 'godwinalugbin004@gmail.com', '445667777888', 'Questions about enrollment', 'Email', 'Morning', 12, 'nopne', 1, '2025-10-02 21:46:31', 'Online', 'pending', NULL, 'des@example.com', 'desmond_dojo'),
(34, 'jj', 'godwinalugbin004@gmail.com', '447643356563', 'Fees & plans', 'Email', 'Evening', 8, 'nohvcdgstdr', 1, '2025-10-02 21:57:35', 'Online', 'pending', NULL, 'des@example.com', 'desmond_dojo'),
(35, 'kk', 'godwinalugbin004@gmail.com', '448383483848', 'Schedule & availability', 'Email', 'Afternoon', 2, 'sss', 1, '2025-11-05 15:18:58', 'Physical', 'pending', NULL, 'des@example.com', 'desmond_dojo'),
(36, 'John Russo', 'ofiligadi@gmail.com', '2348067436847', 'Interested in booking a trial class', 'Email', 'Morning', 1, 'Gaishshs', 1, '2025-11-05 17:07:26', 'Online', 'pending', NULL, 'des@example.com', 'desmond_dojo');

-- --------------------------------------------------------

--
-- Table structure for table `deletion_requests`
--

CREATE TABLE `deletion_requests` (
  `id` int(11) NOT NULL,
  `title` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dojos`
--

CREATE TABLE `dojos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(160) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `tagline` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dojos`
--

INSERT INTO `dojos` (`id`, `name`, `created_at`, `tagline`, `description`, `slug`) VALUES
(1, 'Ikoyi', '2025-08-20 11:18:34', NULL, NULL, NULL),
(2, 'Master XYZ', '2025-08-22 09:42:40', 'Learn together', NULL, NULL),
(3, 'Samurai Dojo', '2025-08-22 09:52:43', 'Strength and honor', NULL, 'samurai-dojo'),
(4, 'Master Dennis', '2025-08-28 12:26:50', 'Let us learn together everyone.', NULL, 'master-dennis'),
(5, 'Kyoto Dojo', '2025-09-09 08:19:59', NULL, NULL, 'kyoto-dojo'),
(6, 'Ade Dojo', '2025-09-09 09:00:34', NULL, NULL, 'ade-dojo'),
(7, 'Desmond Dojo', '2025-09-09 10:47:44', NULL, NULL, 'desmond-dojo');

-- --------------------------------------------------------

--
-- Table structure for table `enrolled_children`
--

CREATE TABLE `enrolled_children` (
  `id` int(11) NOT NULL,
  `enrollment_id` varchar(50) NOT NULL,
  `child_name` varchar(100) NOT NULL,
  `child_email` varchar(100) NOT NULL,
  `experience_level` varchar(50) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `enrollment_id` varchar(50) NOT NULL,
  `class_id` varchar(50) NOT NULL,
  `parent_email` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `class_ids` text NOT NULL,
  `visibility` text NOT NULL,
  `event_date` date NOT NULL,
  `start_time` varchar(20) NOT NULL,
  `end_time` varchar(20) NOT NULL,
  `notification_value` int(11) DEFAULT 0,
  `notification_unit` varchar(20) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `link` varchar(255) NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `notification_sent` tinyint(1) DEFAULT 0,
  `response_status` varchar(121) NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `role` varchar(100) DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `instructors_tbl`
--

CREATE TABLE `instructors_tbl` (
  `id` int(11) NOT NULL,
  `instructor_first_name` varchar(50) DEFAULT NULL,
  `instructor_last_name` varchar(50) DEFAULT NULL,
  `instructor_email` varchar(100) DEFAULT NULL,
  `invited_by` varchar(121) NOT NULL,
  `class` varchar(100) DEFAULT NULL,
  `status` varchar(121) NOT NULL DEFAULT 'pending'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `chat_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `chat_id`, `sender_id`, `message`, `created_at`) VALUES
(1, 1, 2, 'Welcome to the \"Danger Zone\" group!', '2025-08-26 12:10:14'),
(2, 2, 2, 'Welcome to the \"Kung Fu\" group!', '2025-08-26 12:32:18');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `type` varchar(50) DEFAULT NULL,
  `event_id` varchar(121) DEFAULT NULL,
  `accept_decline` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_email`, `title`, `message`, `is_read`, `created_at`, `type`, `event_id`, `accept_decline`, `status`) VALUES
(1, 'hemmanueldami@gmail.com', 'Welcome to DOJO Connect', 'Hi Damilare Emmanuel, your admin account has been created. Kindly hit the button below to complete your profile information.', 0, '2025-08-26 11:41:57', 'signup', NULL, NULL, 'pending'),
(2, 'hemmanueldami@gmail.com', 'New Class Created', 'Your class \"Danger Zone\" was created successfully.', 0, '2025-08-26 12:10:14', 'message', NULL, NULL, 'pending'),
(3, 'hemmanueldami@gmail.com', 'New Class Created', 'Your class \"Kung Fu\" was created successfully.', 0, '2025-08-26 12:32:18', 'message', NULL, NULL, 'pending'),
(4, 'hjd@s.com', 'Appointment Scheduled', 'Hi kdkds, your consultation appointment is scheduled for 2025-09-29 from 10:19 to 10:49.', 0, '2025-09-09 11:20:30', 'appointment', '23', NULL, 'pending'),
(5, 'ade@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from akskd jdjd.', 0, '2025-09-09 11:40:59', 'consultation_request', '25', NULL, 'pending'),
(6, 'ade@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from ndjd jdjke.', 0, '2025-09-09 11:43:16', 'consultation_request', '26', NULL, 'pending'),
(7, 'kek@jdj.com', 'Appointment Scheduled', 'Hi ndjd jdjke, your consultation appointment is scheduled for 2025-09-24 from 10:04 to 10:34.', 0, '2025-09-09 11:43:55', 'appointment', '24', NULL, 'pending'),
(8, 'des@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from jdjd jdike.', 0, '2025-09-09 11:49:06', 'consultation_request', '27', NULL, 'pending'),
(9, 'idi@kd.com', 'Appointment Scheduled', 'Hi jdjd jdike, your consultation appointment is scheduled for 2025-09-27 from 10:50 to 11:20.', 0, '2025-09-09 11:49:40', 'appointment', '25', NULL, 'pending'),
(10, 'des@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from dd.', 0, '2025-09-11 23:15:20', 'consultation_request', '28', NULL, 'pending'),
(11, 'des@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from Ismail sherifat Omotola.', 0, '2025-09-14 19:07:20', 'consultation_request', '29', NULL, 'pending'),
(12, 'des@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from July juls.', 0, '2025-09-14 19:09:38', 'consultation_request', '30', NULL, 'pending'),
(13, 'des@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from John Doe.', 0, '2025-09-29 06:16:30', 'consultation_request', '31', NULL, 'pending'),
(14, 'des@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from John Doe.', 0, '2025-09-29 07:40:41', 'consultation_request', '32', NULL, 'pending'),
(15, 'ofiligadi@gmail.com', 'Appointment Scheduled', 'Hi John Doe, your consultation appointment is scheduled for 2025-09-30 from 11:42 to 12:12.', 0, '2025-09-29 07:43:44', 'appointment', '26', NULL, 'pending'),
(16, 'des@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from John smith.', 0, '2025-10-02 17:46:32', 'consultation_request', '33', NULL, 'pending'),
(17, 'des@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from jj.', 0, '2025-10-02 17:57:36', 'consultation_request', '34', NULL, 'pending'),
(18, 'des@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from kk.', 0, '2025-11-05 10:18:59', 'consultation_request', '35', NULL, 'pending'),
(19, 'des@example.com', 'New Appointment Request', 'Hi, your dojo has a new consultation request from John Russo.', 0, '2025-11-05 12:07:27', 'consultation_request', '36', NULL, 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `parents`
--

CREATE TABLE `parents` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `enrollment_id` varchar(255) DEFAULT '',
  `class_id` varchar(255) DEFAULT ''
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scheduled_appointments`
--

CREATE TABLE `scheduled_appointments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `consultation_request_id` bigint(20) UNSIGNED NOT NULL,
  `dojo_tag` varchar(255) DEFAULT NULL,
  `dojo_id` int(11) DEFAULT NULL,
  `scheduled_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `address_text` varchar(255) DEFAULT NULL,
  `meeting_link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `parent_email` varchar(255) NOT NULL,
  `parent_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `scheduled_appointments`
--

INSERT INTO `scheduled_appointments` (`id`, `consultation_request_id`, `dojo_tag`, `dojo_id`, `scheduled_date`, `start_time`, `end_time`, `address_text`, `meeting_link`, `created_at`, `parent_email`, `parent_name`) VALUES
(2, 1, NULL, NULL, '2025-09-05', '14:00:00', '15:00:00', '123 Main Street, City', 'https://zoom.us/j/1234567890', '2025-09-03 08:52:09', '', NULL),
(3, 1, NULL, NULL, '2025-09-05', '14:00:00', '15:00:00', '123 Main Street, City', 'https://zoom.us/j/1234567890', '2025-09-03 15:24:35', '', NULL),
(4, 8, NULL, 1, '2025-09-05', '23:05:00', '23:05:00', NULL, 'goof.com', '2025-09-03 15:25:09', '', NULL),
(5, 9, NULL, 1, '2025-09-25', '23:06:00', '23:06:00', NULL, 'Google.com', '2025-09-03 15:27:32', '', NULL),
(6, 11, NULL, 1, '2025-09-25', '19:30:00', '20:00:00', NULL, 'Google.com', '2025-09-03 16:26:19', '', NULL),
(7, 10, NULL, 1, '2025-09-08', '10:00:00', '11:00:00', '123 Main Street, Springfield', 'https://meet.google.com/xyz-abcd-123', '2025-09-05 19:25:48', 'godwinatomicsoda@gmail.com', 'Jane Doe'),
(8, 10, NULL, 1, '2025-09-08', '10:00:00', '11:00:00', '123 Main Street, Springfield', 'https://meet.google.com/xyz-abcd-123', '2025-09-05 19:26:14', 'godwinatomicsoda@gmail.com', 'Jane Doe'),
(9, 10, NULL, 1, '2025-09-08', '10:00:00', '11:00:00', '123 Main Street, Springfield', 'https://meet.google.com/xyz-abcd-123', '2025-09-05 19:27:34', 'godwinatomicsoda@gmail.com', 'Jane Doe'),
(10, 10, NULL, 1, '2025-09-08', '10:00:00', '11:00:00', '123 Main Street, Springfield', 'https://meet.google.com/xyz-abcd-123', '2025-09-05 19:58:22', 'godwinatomicsoda@gmail.com', 'Jane Doe'),
(11, 10, NULL, 1, '2025-09-08', '10:00:00', '11:00:00', '123 Main Street, Springfield', 'https://meet.google.com/xyz-abcd-123', '2025-09-06 04:02:02', 'godwinatomicsoda@gmail.com', 'Jane Doe'),
(12, 10, NULL, 1, '2025-09-08', '10:00:00', '11:00:00', '123 Main Street, Springfield', 'https://meet.google.com/xyz-abcd-123', '2025-09-06 04:02:28', 'godwinatomicsoda@gmail.com', 'Jane Doe'),
(13, 10, NULL, 1, '2025-09-08', '10:00:00', '11:00:00', '123 Main Street, Springfield', 'https://meet.google.com/xyz-abcd-123', '2025-09-06 04:03:05', 'godwinatomicsoda@gmail.com', 'Jane Doe'),
(14, 10, NULL, 1, '2025-09-08', '10:00:00', '11:00:00', '123 Main Street, Springfield', 'https://meet.google.com/xyz-abcd-123', '2025-09-06 04:07:21', 'godwinatomicsoda@gmail.com', 'Jane Doe'),
(15, 10, NULL, 1, '2025-09-08', '10:00:00', '11:00:00', '123 Main Street, Springfield', 'https://meet.google.com/xyz-abcd-123', '2025-09-06 04:08:18', 'godwinatomicsoda@gmail.com', 'Jane Doe'),
(16, 10, NULL, 1, '2025-09-08', '10:00:00', '11:00:00', '123 Main Street, Springfield', 'https://meet.google.com/xyz-abcd-123', '2025-09-06 04:08:38', 'godwinatomicsoda@gmail.com', 'Jane Doe'),
(17, 10, NULL, 1, '2025-09-08', '10:00:00', '11:00:00', '123 Main Street, Springfield', 'https://meet.google.com/xyz-abcd-123', '2025-09-06 04:15:12', 'godwinatomicsoda@gmail.com', 'Jane Doe'),
(18, 18, NULL, 6, '2025-09-25', '11:02:00', '11:32:00', NULL, 'for.com', '2025-09-09 10:02:26', 'hjd@s.com', 'kdkds'),
(19, 18, NULL, 6, '2025-09-25', '11:02:00', '11:32:00', NULL, 'n.com', '2025-09-09 10:06:32', 'hjd@s.com', 'kdkds'),
(20, 19, NULL, 6, '2025-09-27', '00:11:00', '00:41:00', 'Ibadan house', NULL, '2025-09-09 10:11:11', 'mercry@fjf.com', 'Mercy Light'),
(21, 19, 'ade_dojo', NULL, '2025-09-23', '10:15:00', '10:45:00', 'Mapo ga', NULL, '2025-09-09 10:16:58', 'mercry@fjf.com', 'Mercy Light'),
(22, 18, 'ade_dojo', NULL, '2025-09-29', '10:19:00', '10:49:00', NULL, 'na.com', '2025-09-09 10:19:42', 'hjd@s.com', 'kdkds'),
(23, 18, 'ade_dojo', NULL, '2025-09-29', '10:19:00', '10:49:00', NULL, 'na.com', '2025-09-09 10:20:28', 'hjd@s.com', 'kdkds'),
(24, 26, 'ade_dojo', NULL, '2025-09-24', '10:04:00', '10:34:00', NULL, 'nah.com', '2025-09-09 10:43:51', 'kek@jdj.com', 'ndjd jdjke'),
(25, 27, 'desmond_dojo', NULL, '2025-09-27', '10:50:00', '11:20:00', 'mapo hall', NULL, '2025-09-09 10:49:35', 'idi@kd.com', 'jdjd jdike'),
(26, 32, 'desmond_dojo', NULL, '2025-09-30', '11:42:00', '12:12:00', 'Dojo Hall, London', NULL, '2025-09-29 11:43:44', 'ofiligadi@gmail.com', 'John Doe');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `class_id` varchar(255) DEFAULT NULL,
  `added_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `assigned_to` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `notification_value` varchar(10) DEFAULT NULL,
  `notification_unit` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','in_progress','completed','declined') DEFAULT 'pending',
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `transaction_title` varchar(255) NOT NULL,
  `revenue` decimal(10,2) DEFAULT 0.00,
  `expenses` decimal(10,2) DEFAULT 0.00,
  `committed_by` varchar(255) DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  `class_id` int(11) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trial_class_bookings`
--

CREATE TABLE `trial_class_bookings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `class_id` bigint(20) UNSIGNED NOT NULL,
  `parent_name` varchar(160) NOT NULL,
  `email` varchar(190) NOT NULL,
  `phone` varchar(25) NOT NULL,
  `number_of_children` int(11) NOT NULL DEFAULT 1,
  `appointment_date` datetime NOT NULL,
  `payment_status` enum('pending','captured','failed','refunded') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `dojo_tag` varchar(255) NOT NULL,
  `class_name` varchar(255) NOT NULL,
  `instructor_name` varchar(255) NOT NULL,
  `class_image` varchar(500) DEFAULT NULL,
  `trial_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` varchar(255) NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `trial_class_bookings`
--

INSERT INTO `trial_class_bookings` (`id`, `class_id`, `parent_name`, `email`, `phone`, `number_of_children`, `appointment_date`, `payment_status`, `created_at`, `updated_at`, `dojo_tag`, `class_name`, `instructor_name`, `class_image`, `trial_fee`, `status`) VALUES
(1, 1, 'John Doe', 'john.doe@example.com', '+1234567890', 2, '2025-09-01 10:00:00', 'pending', '2025-08-22 12:46:01', NULL, '', '', '', NULL, 0.00, 'pending'),
(2, 1, 'bb', 'bb@b.com', '+44111111111', 11, '2025-06-26 00:00:00', 'pending', '2025-08-22 13:40:09', NULL, '', '', '', NULL, 0.00, 'pending'),
(3, 1, 'ss', 'a@s.com', '+441111111', 11, '2025-06-12 00:00:00', 'pending', '2025-08-22 14:01:39', NULL, '', '', '', NULL, 0.00, 'pending'),
(4, 1, 'ss', 'a@s.com', '+441111111', 11, '2025-06-12 00:00:00', 'pending', '2025-08-22 14:01:39', NULL, '', '', '', NULL, 0.00, 'pending'),
(5, 6, 'z', 'zz@z.com', '+441111111111', 11, '2025-06-26 00:00:00', 'pending', '2025-08-22 15:50:57', NULL, '', '', '', NULL, 0.00, 'pending'),
(6, 6, 'z', 'zz@z.com', '+441111111111', 11, '2025-06-26 00:00:00', 'pending', '2025-08-22 15:50:57', NULL, '', '', '', NULL, 0.00, 'pending'),
(7, 1, 'John Doe', 'john.doe@example.com', '+1234567890', 2, '2025-09-01 10:00:00', 'pending', '2025-08-22 16:06:20', NULL, '', '', '', NULL, 0.00, 'pending'),
(8, 1, 'John Doe', 'john.doe@example.com', '+1234567890', 2, '2025-09-01 10:00:00', 'pending', '2025-08-22 16:06:31', NULL, '', '', '', NULL, 0.00, 'pending'),
(9, 1, 'John Doe', 'john.doe@example.com', '+1234567890', 2, '2025-09-01 10:00:00', 'pending', '2025-08-22 16:06:31', NULL, '', '', '', NULL, 0.00, 'pending'),
(10, 1, 'ss', 's@s.com', '+441111111111', 11, '2025-06-12 00:00:00', 'pending', '2025-08-22 17:11:46', NULL, '', '', '', NULL, 0.00, 'pending'),
(11, 1, 'ss', 's@s.com', '+441111111111', 11, '2025-06-12 00:00:00', 'pending', '2025-08-22 17:11:46', NULL, '', '', '', NULL, 0.00, 'pending'),
(12, 1, 'jane ddd', 'ss@s.com', '+443263636363', 111, '2025-06-12 00:00:00', 'pending', '2025-08-28 12:30:51', NULL, '', '', '', NULL, 0.00, 'pending'),
(13, 1, 'jane ddd', 'ss@s.com', '+443263636363', 111, '2025-06-12 00:00:00', 'pending', '2025-08-28 12:30:51', NULL, '', '', '', NULL, 0.00, 'pending'),
(14, 1, 'John Doe', 'johndoe@example.com', '+1234567890', 2, '2025-09-15 01:00:00', 'pending', '2025-09-11 08:45:27', NULL, 'des_mond', '', '', NULL, 0.00, 'pending'),
(15, 1, 'John Doe', 'johndoe@example.com', '+1234567890', 2, '2025-09-15 01:00:00', 'pending', '2025-09-11 08:45:34', NULL, 'des_monds', '', '', NULL, 0.00, 'pending'),
(16, 1, 'John Doe', 'johndoe@example.com', '+1234567890', 2, '2025-09-15 01:00:00', 'pending', '2025-09-11 08:49:44', NULL, 'desmond_dojo', '', '', NULL, 0.00, 'pending'),
(17, 1, 'John Doe', 'johndoe@example.com', '+1234567890', 2, '2025-09-15 01:00:00', 'pending', '2025-09-11 08:49:45', NULL, 'desmond_dojo', '', '', NULL, 0.00, 'pending'),
(18, 1, 'John Doe', 'johndoe@example.com', '+1234567890', 2, '2025-09-15 00:00:00', 'pending', '2025-09-11 09:10:31', NULL, 'desmond_dojo', 'Beginner - Taekwondo', 'Cameron Williamson', 'jdj', 25.00, 'pending'),
(19, 1, 'd', 'dd@d.com', '+441111111', 11, '2025-06-24 00:00:00', 'pending', '2025-09-11 18:46:09', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 0.00, 'pending'),
(20, 1, 'd', 'dd@d.com', '+441111111', 11, '2025-06-24 00:00:00', 'pending', '2025-09-11 18:46:09', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 0.00, 'pending'),
(21, 1, 'gg', 'ff@f.com', '+447373777773', 1, '2025-06-26 00:00:00', 'pending', '2025-09-11 19:44:16', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 20.00, 'pending'),
(22, 1, 'gg', 'ff@f.com', '+447373777773', 1, '2025-06-26 00:00:00', 'pending', '2025-09-11 19:44:16', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 20.00, 'pending'),
(23, 1, 'Sam Larry', 'sam@larry.com', '+44737373737373', 12, '2025-09-26 00:00:00', 'pending', '2025-09-11 22:26:25', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 20.00, 'pending'),
(24, 1, 'Sam Larry', 'sam@larry.com', '+44737373737373', 12, '2025-09-26 00:00:00', 'pending', '2025-09-11 22:26:25', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 20.00, 'pending'),
(25, 4, 'Nnenna Oye', 'ote@dj.com', '+448282828282', 1, '2025-09-12 00:00:00', 'pending', '2025-09-11 22:27:42', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 20.00, 'pending'),
(26, 4, 'Nnenna Oye', 'ote@dj.com', '+448282828282', 1, '2025-09-12 00:00:00', 'pending', '2025-09-11 22:27:42', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 20.00, 'pending'),
(27, 1, 'Den iss', 'ksk@xn.com', '+447373737373', 1, '2025-09-26 00:00:00', 'pending', '2025-09-11 23:01:31', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 20.00, 'pending'),
(28, 1, 'Den iss', 'ksk@xn.com', '+447373737373', 1, '2025-09-26 00:00:00', 'pending', '2025-09-11 23:01:31', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 20.00, 'pending'),
(29, 6, 'Ade wale', 'imole@dhj.com', '+44727272727272', 3, '2025-09-24 00:00:00', 'pending', '2025-09-11 23:09:02', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop', 60.00, 'pending'),
(30, 6, 'Ade wale', 'imole@dhj.com', '+44727272727272', 3, '2025-09-24 00:00:00', 'pending', '2025-09-11 23:09:02', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop', 60.00, 'pending'),
(31, 3, 'ade ddd', 'dn@dkd.com', '+447272727726', 2, '2025-09-24 00:00:00', 'pending', '2025-09-11 23:11:28', NULL, 'desmond_dojo', 'Judo', 'Homer Simpson', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop', 50.00, 'pending'),
(32, 3, 'ade ddd', 'dn@dkd.com', '+447272727726', 2, '2025-09-24 00:00:00', 'pending', '2025-09-11 23:11:28', NULL, 'desmond_dojo', 'Judo', 'Homer Simpson', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop', 50.00, 'pending'),
(33, 6, 'ff', 'jfj@kf.com', '+4422222222', 2, '2025-09-24 00:00:00', 'pending', '2025-09-11 23:12:16', NULL, 'desmond_dojo', 'Kickboxing', 'Milhouse Van Houten', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(34, 6, 'ff', 'jfj@kf.com', '+4422222222', 2, '2025-09-24 00:00:00', 'pending', '2025-09-11 23:12:16', NULL, 'desmond_dojo', 'Kickboxing', 'Milhouse Van Houten', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(35, 1, 'Godwin Alugbin', 'godsj@gmail.com', '+441245405434548', 5, '2025-09-26 00:00:00', 'pending', '2025-09-12 01:55:44', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(36, 1, 'Godwin Alugbin', 'godsj@gmail.com', '+441245405434548', 5, '2025-09-26 00:00:00', 'pending', '2025-09-12 01:55:44', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(37, 1, 'Charlie Putin', 'sherifatomotola2018@gmail.com', '+44679086544327980909', 3, '2025-09-17 00:00:00', 'pending', '2025-09-14 22:03:48', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(38, 1, 'Charlie Putin', 'sherifatomotola2018@gmail.com', '+44679086544327980909', 3, '2025-09-17 00:00:00', 'pending', '2025-09-14 22:03:48', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(39, 1, 'Ismail Sherifat Omotola', 'sherifatomotola2018@gmail.com', '+449800879237863652709808', 5, '2025-10-24 00:00:00', 'pending', '2025-09-14 22:09:47', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(40, 1, 'Ismail Sherifat Omotola', 'sherifatomotola2018@gmail.com', '+449800879237863652709808', 5, '2025-10-24 00:00:00', 'pending', '2025-09-14 22:09:48', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(41, 1, 'jdjr', 'jj@djfd.com', '+44447827272727', 11, '2025-09-22 00:00:00', 'pending', '2025-09-15 17:55:29', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(42, 1, 'jdjr', 'jj@djfd.com', '+44447827272727', 11, '2025-09-22 00:00:00', 'pending', '2025-09-15 17:55:29', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(43, 3, 'John Day', 'ofiligadi@gmail.com', '+4444000000000', 3, '2025-10-10 00:00:00', 'pending', '2025-09-29 11:47:14', NULL, 'desmond_dojo', 'Judo', 'Homer Simpson', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop', 25.00, 'pending'),
(44, 3, 'John Day', 'ofiligadi@gmail.com', '+4444000000000', 3, '2025-10-10 00:00:00', 'pending', '2025-09-29 11:47:15', NULL, 'desmond_dojo', 'Judo', 'Homer Simpson', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop', 25.00, 'pending'),
(45, 1, 'g', 'dd@d.c', '+44445252525252', 1, '2025-10-22 00:00:00', 'pending', '2025-10-01 12:56:47', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(46, 1, 'g', 'dd@d.c', '+44445252525252', 1, '2025-10-22 00:00:00', 'pending', '2025-10-01 12:56:47', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(47, 1, 'James Fawkin', 'kiyiszn@gmail.com', '+4444000000000', 3, '2025-11-12 00:00:00', 'pending', '2025-11-05 17:12:58', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending'),
(48, 1, 'James Fawkin', 'kiyiszn@gmail.com', '+4444000000000', 3, '2025-11-12 00:00:00', 'pending', '2025-11-05 17:12:59', NULL, 'desmond_dojo', 'Taekwondo', 'Lisa Simpson', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1600&auto=format&fit=crop', 15.00, 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `referred_by` varchar(255) DEFAULT NULL,
  `avatar` text DEFAULT NULL,
  `role` enum('admin','instructor','parent','child') DEFAULT 'child',
  `balance` decimal(10,2) DEFAULT 0.00,
  `referral_code` varchar(255) DEFAULT NULL,
  `active_sub` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `dob` varchar(20) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `street` varchar(100) DEFAULT NULL,
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `subscription_status` varchar(50) DEFAULT NULL,
  `trial_ends_at` datetime DEFAULT NULL,
  `stripe_account_id` varchar(255) NOT NULL,
  `dojo_id` int(11) DEFAULT NULL,
  `dojo_tag` varchar(255) DEFAULT NULL,
  `dojo_name` varchar(255) DEFAULT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `referred_by`, `avatar`, `role`, `balance`, `referral_code`, `active_sub`, `created_at`, `dob`, `gender`, `city`, `street`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `trial_ends_at`, `stripe_account_id`, `dojo_id`, `dojo_tag`, `dojo_name`, `tagline`, `description`) VALUES
(1, 'System', 'system@dojoconnect.com', NULL, NULL, NULL, 'admin', 0.00, NULL, NULL, '2025-08-26 10:30:33', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL),
(2, 'Damilare Emmanuel', 'hemmanueldami@gmail.com', '$2y$10$/EOwjVKV3f0nWy6rhHRXG.EikNNS9xhf2O8EtbjoznQTx28KwEDku', '', NULL, 'admin', 0.00, 'DOJ8541', 'starter', '2025-08-26 10:41:57', NULL, NULL, NULL, NULL, 'cus_SwCjRkPU7LdsW6', 'sub_1S0KK7RbZzajfaIISffUBp45', 'trialing', '2025-09-09 11:41:55', '', NULL, NULL, NULL, NULL, NULL),
(3, 'John Doe', 'john@example.com', NULL, NULL, NULL, 'parent', 0.00, NULL, NULL, '2025-09-09 08:22:24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 5, 'kyoto_dojo', 'Kyoto Dojo', NULL, NULL),
(4, 'John Doe', 'johns@example.com', NULL, NULL, NULL, 'parent', 0.00, NULL, NULL, '2025-09-09 08:26:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 5, 'kyoto_dojo_1', 'Kyoto Dojo', NULL, NULL),
(5, 'John Doe', 'johnse@example.com', NULL, NULL, NULL, 'parent', 0.00, NULL, NULL, '2025-09-09 08:28:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 5, 'kyoto_dojo_2', 'Kyoto Dojo', 'best dojo on earth', 'nothing much'),
(6, 'Ade Wale', 'ade@example.com', NULL, NULL, NULL, 'parent', 0.00, NULL, NULL, '2025-09-09 09:00:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 6, 'ade_dojo', 'Ade Dojo', 'best dojo on earth', 'nothing much'),
(7, 'Des Mond', 'des@example.com', NULL, NULL, NULL, 'parent', 0.00, NULL, NULL, '2025-09-09 10:47:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 7, 'desmond_dojo', 'Desmond Dojo', 'best dojo on earth', 'this is a very good place to learn');

-- --------------------------------------------------------

--
-- Table structure for table `user_cards`
--

CREATE TABLE `user_cards` (
  `id` int(11) NOT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `payment_method_id` varchar(255) DEFAULT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `last4` varchar(4) DEFAULT NULL,
  `exp_month` varchar(2) DEFAULT NULL,
  `exp_year` varchar(4) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `user_cards`
--

INSERT INTO `user_cards` (`id`, `user_email`, `payment_method_id`, `brand`, `last4`, `exp_month`, `exp_year`, `is_default`, `created_at`) VALUES
(1, 'hemmanueldami@gmail.com', 'pm_1S0KK4RbZzajfaIIex8DXMyF', 'visa', '4242', '5', '2028', 1, '2025-08-26 10:41:57');

-- --------------------------------------------------------

--
-- Table structure for table `waitlist`
--

CREATE TABLE `waitlist` (
  `id` int(11) NOT NULL,
  `fullname` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `waitlist`
--

INSERT INTO `waitlist` (`id`, `fullname`, `email`, `created_at`) VALUES
(1, 'john', 'john0082@gmail.com', '2025-08-27 08:04:40');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `announcement_recipients`
--
ALTER TABLE `announcement_recipients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `announcement_id` (`announcement_id`);

--
-- Indexes for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `broadcast_recipients`
--
ALTER TABLE `broadcast_recipients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`message_id`),
  ADD KEY `recipient_id` (`recipient_id`);

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `chat_participants`
--
ALTER TABLE `chat_participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_chat_participants` (`chat_id`,`user_id`);

--
-- Indexes for table `children_subscription`
--
ALTER TABLE `children_subscription`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `class_uid` (`class_uid`);

--
-- Indexes for table `class_schedule`
--
ALTER TABLE `class_schedule`
  ADD PRIMARY KEY (`id`),
  ADD KEY `class_id` (`class_id`);

--
-- Indexes for table `consultation_requests`
--
ALTER TABLE `consultation_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `deletion_requests`
--
ALTER TABLE `deletion_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dojos`
--
ALTER TABLE `dojos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `enrolled_children`
--
ALTER TABLE `enrolled_children`
  ADD PRIMARY KEY (`id`),
  ADD KEY `enrollment_id` (`enrollment_id`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `enrollment_id` (`enrollment_id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `instructors_tbl`
--
ALTER TABLE `instructors_tbl`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_messages_chat_id` (`chat_id`),
  ADD KEY `idx_messages_sender_id` (`sender_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_parent_enrollment` (`email`,`enrollment_id`,`class_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `scheduled_appointments`
--
ALTER TABLE `scheduled_appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `consultation_request_id` (`consultation_request_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `trial_class_bookings`
--
ALTER TABLE `trial_class_bookings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `dojo_tag` (`dojo_tag`);

--
-- Indexes for table `user_cards`
--
ALTER TABLE `user_cards`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `waitlist`
--
ALTER TABLE `waitlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `announcement_recipients`
--
ALTER TABLE `announcement_recipients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance_records`
--
ALTER TABLE `attendance_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `broadcast_recipients`
--
ALTER TABLE `broadcast_recipients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `chat_participants`
--
ALTER TABLE `chat_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `children_subscription`
--
ALTER TABLE `children_subscription`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `class_schedule`
--
ALTER TABLE `class_schedule`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `consultation_requests`
--
ALTER TABLE `consultation_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `deletion_requests`
--
ALTER TABLE `deletion_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dojos`
--
ALTER TABLE `dojos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `enrolled_children`
--
ALTER TABLE `enrolled_children`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `instructors_tbl`
--
ALTER TABLE `instructors_tbl`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `parents`
--
ALTER TABLE `parents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `scheduled_appointments`
--
ALTER TABLE `scheduled_appointments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trial_class_bookings`
--
ALTER TABLE `trial_class_bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `user_cards`
--
ALTER TABLE `user_cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `waitlist`
--
ALTER TABLE `waitlist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `scheduled_appointments`
--
ALTER TABLE `scheduled_appointments`
  ADD CONSTRAINT `scheduled_appointments_ibfk_1` FOREIGN KEY (`consultation_request_id`) REFERENCES `consultation_requests` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
