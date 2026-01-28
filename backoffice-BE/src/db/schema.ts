import { sql } from "drizzle-orm";
import {
  mysqlTable,
  tinyint,
  unique,
  int,
  varchar,
  timestamp,
  datetime,
  text,
  index,
  date,
  mysqlEnum,
  decimal,
  time,
  boolean,
  json,
  uniqueIndex,
  smallint,
  check,
} from "drizzle-orm/mysql-core";
import { uuidv7 } from "uuidv7";
import {
  NotificationType,
  SupportedOAuthProviders,
  Role,
  StripePlans,
  DojoStatus,
  BillingStatus,
  ACTIVE_BILLING_STATUSES,
  StripeSubscriptionStatus,
  InstructorInviteStatus,
  ExperienceLevel,
  ClassStatus,
  ClassFrequency,
  ClassSubscriptionType,
  Weekday,
  ClassOccurrenceStatus,
  ChatType,
} from "../constants/enums.js";
import { OtpStatus, OtpType, EmailUpdateStatus } from "../core/constants/auth.constants.js";

const activeBillingStatusesSql = sql.join(
  ACTIVE_BILLING_STATUSES.map((status) => sql.raw(`'${status}'`)),
  sql`, `,
);

const SubTypeFreeSQL = sql.raw(`'${ClassSubscriptionType.Free}'`);
const SubTypePaidSQL = sql.raw(`'${ClassSubscriptionType.Paid}'`);

const UUID_LENGTH = 36;

const uuidPrimaryKey = () =>
  varchar("id", { length: UUID_LENGTH })
    .primaryKey()
    .$defaultFn(() => uuidv7());

export const admin = mysqlTable(
  "admin",
  {
    id: uuidPrimaryKey(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    password: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique("email").on(table.email)],
);

export const adminPasswordResets = mysqlTable("admin_password_resets", {
  id: uuidPrimaryKey(),
  adminEmail: varchar("admin_email", { length: 255 }).notNull(),
  otp: varchar({ length: 6 }).notNull(),
  expiresAt: datetime("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const announcements = mysqlTable("announcements", {
  id: uuidPrimaryKey(),
  title: varchar({ length: 255 }).notNull(),
  message: text().notNull(),
  senderEmail: varchar("sender_email", { length: 255 }).notNull(),
  urgency: varchar({ length: 50 }).default("Update"),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
});

export const announcementRecipients = mysqlTable(
  "announcement_recipients",
  {
    id: uuidPrimaryKey(),
    announcementId: int("announcement_id").notNull(),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  },
  (table) => [index("announcement_id").on(table.announcementId)],
);

export const attendanceRecords = mysqlTable("attendance_records", {
  id: uuidPrimaryKey(),
  classId: varchar("class_id", { length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  attendanceDate: date("attendance_date", { mode: "string" }).notNull(),
  status: mysqlEnum(["Present", "Absent", "Late"]).notNull(),
  createdAt: timestamp("created_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const broadcastRecipients = mysqlTable(
  "broadcast_recipients",
  {
    id: uuidPrimaryKey(),
    messageId: int("message_id").notNull(),
    recipientId: int("recipient_id").notNull(),
  },
  (table) => [index("message_id").on(table.messageId), index("recipient_id").on(table.recipientId)],
);

export const chats = mysqlTable(
  "chats",
  {
    id: uuidPrimaryKey(),
    type: mysqlEnum(ChatType).notNull(),
    name: varchar({ length: 100 }),
    createdBy: varchar("created_by", { length: UUID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [index("created_by").on(table.createdBy)],
);

export const chatParticipants = mysqlTable(
  "chat_participants",
  {
    id: uuidPrimaryKey(),
    chatId: varchar("chat_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => chats.id, { onDelete: "restrict" }),
    userId: varchar("user_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    joinedAt: timestamp("joined_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    leftAt: timestamp("left_at"),
  },
  (table) => [
    index("user_id").on(table.userId),
    uniqueIndex("unique_idx_chat_id_user_id").on(table.chatId, table.userId),
  ],
);

export const classes = mysqlTable(
  "classes",
  {
    id: uuidPrimaryKey(),
    dojoId: varchar("dojo_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => dojos.id, { onDelete: "cascade" }),
    instructorId: varchar("instructor_id", { length: UUID_LENGTH }).references(
      () => dojoInstructors.id,
      { onDelete: "set null" },
    ),
    name: varchar({ length: 150 }).notNull(),
    description: varchar({ length: 150 }),
    level: mysqlEnum(ExperienceLevel).notNull(),
    minAge: tinyint("min_age", { unsigned: true }).notNull(),
    maxAge: tinyint("max_age", { unsigned: true }).notNull(),
    capacity: smallint({ unsigned: true }).notNull(),
    chatId: varchar("chat_id", { length: UUID_LENGTH }).notNull().references(() => chats.id),
    streetAddress: varchar("street_address", { length: 255 }).notNull(),
    city: varchar("city", { length: 255 }).notNull(),
    gradingDate: timestamp("grading_date"),
    frequency: mysqlEnum(ClassFrequency).notNull(),
    subscriptionType: mysqlEnum("subscription_type", ClassSubscriptionType).notNull(),
    price: decimal({ precision: 10, scale: 2, unsigned: true }),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),
    imagePublicId: varchar("image_public_id", { length: 255 }),
    status: mysqlEnum("status", ClassStatus).default(ClassStatus.Active).notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("instructor_idx").on(t.instructorId),
    index("dojo_idx").on(t.dojoId),
    check("age_range_check", sql`${t.minAge} <= ${t.maxAge}`),
    check("capacity_check", sql`${t.capacity} > 0`),
    check(
      "subscription_price_check",
      sql`(${t.subscriptionType} = ${SubTypeFreeSQL} AND (${t.price} IS NULL OR ${t.price} = 0)) OR (${t.subscriptionType} = ${SubTypePaidSQL} AND (${t.price} IS NOT NULL AND ${t.price} > 0))`,
    ),
  ],
);

export const classSchedules = mysqlTable(
  "class_schedules",
  {
    id: uuidPrimaryKey(),
    classId: varchar("class_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    weekday: mysqlEnum("weekday", Weekday),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    initialClassDate: date("initial_class_date").notNull(),
  },
  (t) => [
    index("class_idx").on(t.classId),
    check("time_order_check", sql`${t.startTime} < ${t.endTime}`),
  ],
);

// Concrete class sessions
export const classOccurrences = mysqlTable("class_occurrences", {
  id: uuidPrimaryKey(),
  scheduleId: varchar("schedule_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => classSchedules.id),
  classId: varchar("class_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => classes.id), // denormalized for faster queries

  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),

  status: mysqlEnum(ClassOccurrenceStatus).notNull().default(ClassOccurrenceStatus.Scheduled),
  cancellationReason: varchar("cancellation_reason", { length: 500 }),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const classEnrollments = mysqlTable(
  "class_enrollments",
  {
    id: uuidPrimaryKey(),
    studentId: varchar("student_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    classId: varchar("class_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    active: boolean("active").default(true).notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("student_class_unique").on(table.studentId, table.classId)],
);

export const classSubscriptions = mysqlTable("class_subscriptions", {
  id: uuidPrimaryKey(),
  studentId: varchar("student_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  classId: varchar("class_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripeSubId: varchar("stripe_sub_id", { length: 255 }).unique().notNull(),
  status: mysqlEnum(BillingStatus).notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  endedAt: timestamp("ended_at"),
});

export const oneTimeClassPayments = mysqlTable("one_time_class_payments", {
  id: uuidPrimaryKey(),
  studentId: varchar("student_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  classId: varchar("class_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).unique().notNull(),
  amount: decimal({ precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum(BillingStatus).notNull(),
  paidAt: timestamp("paid_at"),
});

export const emailUpdateRequests = mysqlTable("email_update_requests", {
  id: uuidPrimaryKey(),
  userId: varchar("user_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  oldEmail: varchar("old_email", { length: 255 }).notNull(),
  newEmail: varchar("new_email", { length: 255 }).notNull(),
  status: mysqlEnum(EmailUpdateStatus).default(EmailUpdateStatus.Pending),
  otpId: varchar("otp_id", { length: UUID_LENGTH })
    .references(() => otps.id, { onDelete: "set null" }),
  requestedAt: timestamp("requested_at",)
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const deletionRequests = mysqlTable("deletion_requests", {
  id: uuidPrimaryKey(),
  title: varchar({ length: 50 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  reason: text(),
  status: mysqlEnum(["pending", "approved", "rejected"]).default("pending"),
  requestedAt: timestamp("requested_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const dojos = mysqlTable(
  "dojos",
  {
    id: uuidPrimaryKey(),
    ownerUserId: varchar("owner_user_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    tag: varchar("tag", { length: 50 }).unique().notNull(),
    tagline: varchar("tagline", { length: 255 }).notNull(),
    status: mysqlEnum(DojoStatus).notNull(),
    balance: decimal({ precision: 10, scale: 2 }).default("0.00").notNull(),
    activeSub: mysqlEnum("active_sub", StripePlans).notNull(),
    hasUsedTrial: boolean("has_used_trial").notNull().default(false),
    trialEndsAt: datetime("trial_ends_at"),
    referralCode: varchar("referral_code", { length: 255 }).notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique().notNull(),
    referredBy: varchar("referred_by", { length: 255 }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [],
);

export const dojoSubscriptions = mysqlTable(
  "dojo_subscriptions",
  {
    id: uuidPrimaryKey(),
    dojoId: varchar("dojo_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => dojos.id, { onDelete: "cascade" }),
    billingStatus: mysqlEnum("billing_status", BillingStatus).notNull(),
    stripeSubId: varchar("stripe_sub_id", {
      length: 255,
    }).unique(),
    stripeSetupIntentId: varchar("stripe_setup_intent_id", { length: 255 }),
    stripeSubStatus: mysqlEnum("strip_sub_status", StripeSubscriptionStatus),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    /**
     * 👇 Generated column for "one active subscription per dojo"
     */
    activeDojoId: varchar("active_dojo_id", { length: UUID_LENGTH }).generatedAlwaysAs(
      sql`
        CASE
          WHEN billing_status IN (${activeBillingStatusesSql})
          THEN dojo_id
          ELSE NULL
        END
      `,
    ),
  },
  (table) => [uniqueIndex("one_active_subscription_per_user").on(table.activeDojoId)],
);

export const enrolledChildren = mysqlTable(
  "enrolled_children",
  {
    id: uuidPrimaryKey(),
    enrollmentId: varchar("enrollment_id", { length: 50 }).notNull(),
    childName: varchar("child_name", { length: 100 }).notNull(),
    childEmail: varchar("child_email", { length: 100 }).notNull(),
    experienceLevel: varchar("experience_level", { length: 50 }).notNull(),
  },
  (table) => [index("enrollment_id").on(table.enrollmentId)],
);

export const enrollments = mysqlTable(
  "enrollments",
  {
    id: uuidPrimaryKey(),
    enrollmentId: varchar("enrollment_id", { length: 50 }).notNull(),
    classId: varchar("class_id", { length: 50 }).notNull(),
    parentEmail: varchar("parent_email", { length: 100 }).notNull(),
    createdAt: datetime("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique("enrollment_id").on(table.enrollmentId)],
);

export const events = mysqlTable("events", {
  id: uuidPrimaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  classIds: text("class_ids").notNull(),
  visibility: text().notNull(),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  eventDate: date("event_date", { mode: "string" }).notNull(),
  startTime: varchar("start_time", { length: 20 }).notNull(),
  endTime: varchar("end_time", { length: 20 }).notNull(),
  notificationValue: int("notification_value").default(0),
  notificationUnit: varchar("notification_unit", { length: 20 }),
  location: varchar({ length: 255 }),
  link: varchar({ length: 255 }).notNull(),
  notificationSent: tinyint("notification_sent").default(0),
  responseStatus: varchar("response_status", { length: 121 }).default("pending").notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

export const feedback = mysqlTable("feedback", {
  id: uuidPrimaryKey(),
  userEmail: varchar("user_email", { length: 255 }),
  message: text(),
  fullName: varchar("full_name", { length: 255 }),
  role: varchar({ length: 100 }),
  submittedAt: timestamp("submitted_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const instructorInvites = mysqlTable("instructor_invites", {
  id: uuidPrimaryKey(),
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 150 }).notNull(),
  dojoId: varchar("dojo_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => dojos.id, { onDelete: "cascade" }),
  classId: varchar("class_id", { length: UUID_LENGTH }).references(() => classes.id, {
    onDelete: "cascade",
  }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), // secure random token
  status: mysqlEnum(InstructorInviteStatus).default(InstructorInviteStatus.Pending).notNull(),
  invitedBy: varchar("invited_by", { length: UUID_LENGTH })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  respondedAt: timestamp("responded_at"),
});

export const dojoInstructors = mysqlTable(
  "dojo_instructors",
  {
    id: uuidPrimaryKey(),
    instructorUserId: varchar("instructor_user_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    dojoId: varchar("dojo_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => dojos.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("dojo_id").on(table.dojoId),
    index("instructor_user_id").on(table.instructorUserId),
    uniqueIndex("unique_dojo_instructor").on(table.dojoId, table.instructorUserId),
  ],
);

export const messages = mysqlTable(
  "messages",
  {
    id: uuidPrimaryKey(),
    chatId: varchar("chat_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => chats.id, { onDelete: "restrict" }),
    senderId: varchar("sender_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    content: text().notNull(),
    createdAt: datetime("created_at",)
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("idx_messages_chat_id").on(table.chatId),
    index("idx_messages_sender_id").on(table.senderId),
    // CRITICAL: Index for fetching history efficiently
    index("idx_messages_chat_id_created_at").on(table.chatId, table.createdAt),
  ],
);

export const notifications = mysqlTable("notifications", {
  id: uuidPrimaryKey(),
  userId: varchar("user_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }),
  message: text(),
  isRead: boolean("is_read").default(false),
  createdAt: datetime("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
  type: mysqlEnum(NotificationType),
  eventId: varchar("event_id", { length: 121 }),
  acceptDecline: varchar("accept_decline", { length: 20 }),
  status: varchar({ length: 20 }).default("pending"),
});

export const userOAuthAccounts = mysqlTable(
  "user_oauth_accounts",
  {
    id: uuidPrimaryKey(),
    userId: varchar("user_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: mysqlEnum(SupportedOAuthProviders).notNull(),
    providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
    profileData: json("profile_data"),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique("provider_user_unique").on(table.provider, table.providerUserId)],
);

export const parents = mysqlTable(
  "parents",
  {
    id: uuidPrimaryKey(),
    userId: varchar("user_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  },
  (table) => [],
);

export const otps = mysqlTable("otps", {
  id: uuidPrimaryKey(),
  userId: varchar("user_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum(OtpType).notNull(),
  hashedOTP: varchar("hashed_otp", { length: 255 }).notNull(),
  attempts: int("attempts").default(0).notNull(),
  status: mysqlEnum(OtpStatus).default(OtpStatus.Pending).notNull(),
  expiresAt: datetime("expires_at").notNull(),
  revokedAt: datetime("revoked_at"), // Block after max attempts
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("user_id").on(table.userId),
]);

export const sessions = mysqlTable(
  "sessions",
  {
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    userEmail: varchar("user_email", { length: 255 }).notNull(),
    userIp: varchar("user_ip", { length: 50 }),
    userAgent: text("user_agent"),
    createdAt: datetime("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
    expiresAt: datetime("expires_at", { mode: "string" }).notNull(),
  },
  (table) => [index("user_email").on(table.userEmail)],
);

// We store refresh tokens to allow revocation (banning a user/device)
export const refreshTokens = mysqlTable("refresh_tokens", {
  id: uuidPrimaryKey(),
  userId: varchar("user_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hashedToken: varchar("hashed_token", { length: 255 }).notNull(), // Never store raw tokens
  userIp: varchar("user_ip", { length: 50 }),
  userAgent: text("user_agent"),
  revoked: boolean("revoked").default(false),
  expiresAt: datetime("expires_at").notNull(),
  lastUsedAt: datetime("last_used_at"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const students = mysqlTable(
  "students",
  {
    id: uuidPrimaryKey(),
    studentUserId: varchar("student_user_id", { length: UUID_LENGTH })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: varchar("parent_id", { length: UUID_LENGTH })
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    experienceLevel: mysqlEnum("experience_level", ExperienceLevel).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [uniqueIndex("unique_student_parent").on(table.studentUserId, table.parentId)],
);

export const stripeWebhookEvents = mysqlTable("stripe_webhook_events", {
  id: varchar("id", { length: 255 }).primaryKey(), // Stripe event id
  type: varchar("type", { length: 100 }).notNull(),
  processedAt: timestamp("processed_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: uuidPrimaryKey(),
  title: varchar({ length: 255 }),
  description: text(),
  assignedTo: varchar("assigned_to", { length: 255 }),
  createdBy: varchar("created_by", { length: 255 }),
  dueDate: datetime("due_date", { mode: "string" }),
  notificationValue: varchar("notification_value", { length: 10 }),
  notificationUnit: varchar("notification_unit", { length: 10 }),
  status: mysqlEnum(["pending", "in_progress", "completed", "declined"]).default("pending"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

export const transactions = mysqlTable("transactions", {
  id: uuidPrimaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  transactionTitle: varchar("transaction_title", { length: 255 }).notNull(),
  revenue: decimal({ precision: 10, scale: 2 }).default("0.00"),
  expenses: decimal({ precision: 10, scale: 2 }).default("0.00"),
  committedBy: varchar("committed_by", { length: 255 }),
  date: timestamp({ mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  classId: int("class_id"),
});

export const users = mysqlTable(
  "users",
  {
    id: uuidPrimaryKey(),
    firstName: varchar({ length: 100 }).notNull(),
    lastName: varchar({ length: 100 }).notNull(),
    email: varchar({ length: 150 }).unique().notNull(),
    username: varchar({ length: 100 }).unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    emailVerified: boolean("email_verified").default(false).notNull(),
    avatar: text(),
    role: mysqlEnum(Role).notNull(),
    dob: date("dob"),
    gender: varchar({ length: 10 }),
    city: varchar({ length: 50 }),
    street: varchar({ length: 100 }),
    fcmToken: text("fcm_token"),
    sessionId: varchar("session_id", { length: 255 }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [],
);

export const userCards = mysqlTable("user_cards", {
  id: uuidPrimaryKey(),
  userId: varchar("user_id", { length: UUID_LENGTH })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  paymentMethodId: varchar("payment_method_id", { length: 255 }),
  brand: varchar({ length: 50 }),
  last4: varchar({ length: 4 }),
  expMonth: int("exp_month"),
  expYear: int("exp_year"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const waitlist = mysqlTable(
  "waitlist",
  {
    id: uuidPrimaryKey(),
    fullname: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [unique("email").on(table.email)],
);
