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
  ClassLevel,
  ClassStatus,
  ClassFrequency,
  ClassSubscriptionType,
  Weekday,
  ClassOccurrenceStatus,
} from "../constants/enums.js";

const activeBillingStatusesSql = sql.join(
  ACTIVE_BILLING_STATUSES.map((status) => sql.raw(`'${status}'`)),
  sql`, `
);

const SubTypeFreeSQL = sql.raw(`'${ClassSubscriptionType.Free}'`);
const SubTypePaidSQL = sql.raw(`'${ClassSubscriptionType.Paid}'`);

export const admin = mysqlTable(
  "admin",
  {
    id: int().autoincrement().primaryKey(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    password: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [unique("email").on(table.email)]
);

export const adminPasswordResets = mysqlTable("admin_password_resets", {
  id: int().autoincrement().primaryKey(),
  adminEmail: varchar("admin_email", { length: 255 }).notNull(),
  otp: varchar({ length: 6 }).notNull(),
  expiresAt: datetime("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const announcements = mysqlTable("announcements", {
  id: int().autoincrement().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  message: text().notNull(),
  senderEmail: varchar("sender_email", { length: 255 }).notNull(),
  urgency: varchar({ length: 50 }).default("Update"),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
});

export const announcementRecipients = mysqlTable(
  "announcement_recipients",
  {
    id: int().autoincrement().primaryKey(),
    announcementId: int("announcement_id").notNull(),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  },
  (table) => [index("announcement_id").on(table.announcementId)]
);

export const attendanceRecords = mysqlTable("attendance_records", {
  id: int().autoincrement().primaryKey(),
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
    id: int().autoincrement().primaryKey(),
    messageId: int("message_id").notNull(),
    recipientId: int("recipient_id").notNull(),
  },
  (table) => [
    index("message_id").on(table.messageId),
    index("recipient_id").on(table.recipientId),
  ]
);

export const chats = mysqlTable(
  "chats",
  {
    id: int().autoincrement().primaryKey(),
    type: mysqlEnum(["dm", "group", "broadcast"]).notNull(),
    name: varchar({ length: 100 }),
    createdBy: int("created_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [index("created_by").on(table.createdBy)]
);

export const chatParticipants = mysqlTable(
  "chat_participants",
  {
    id: int().autoincrement().primaryKey(),
    chatId: int("chat_id").notNull(),
    userId: int("user_id").notNull(),
  },
  (table) => [
    index("user_id").on(table.userId),
    index("idx_chat_participants").on(table.chatId, table.userId),
  ]
);

export const childrenSubscription = mysqlTable("children_subscription", {
  id: int().autoincrement().primaryKey(),
  childId: int("child_id").notNull(),
  enrollmentId: varchar("enrollment_id", { length: 50 }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  status: mysqlEnum(["active", "cancelled", "paused"]).default("active"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
});

export const classes = mysqlTable(
  "classes",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    dojoId: varchar("dojo_id", { length: 36 })
      .notNull()
      .references(() => dojos.id, { onDelete: "cascade" }),
    instructorId: varchar("instructor_id", { length: 36 }).references(
      () => dojoInstructors.id,
      { onDelete: "set null" }
    ),
    name: varchar({ length: 150 }).notNull(),
    description: varchar({ length: 150 }),
    level: mysqlEnum(ClassLevel).notNull(),
    minAge: tinyint("min_age", { unsigned: true }).notNull(),
    maxAge: tinyint("max_age", { unsigned: true }).notNull(),
    capacity: smallint({ unsigned: true }).notNull(),
    streetAddress: varchar("street_address", { length: 255 }).notNull(),
    city: varchar("city", { length: 255 }).notNull(),
    gradingDate: timestamp("grading_date"),
    frequency: mysqlEnum(ClassFrequency).notNull(),
    subscriptionType: mysqlEnum(
      "subscription_type",
      ClassSubscriptionType
    ).notNull(),
    price: decimal({ precision: 10, scale: 2, unsigned: true }),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),
    imagePublicId: varchar("image_public_id", { length: 255 }),
    status: mysqlEnum("status", ClassStatus)
      .default(ClassStatus.Active)
      .notNull(),
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
      sql`(${t.subscriptionType} = ${SubTypeFreeSQL} AND (${t.price} IS NULL OR ${t.price} = 0)) OR (${t.subscriptionType} = ${SubTypePaidSQL} AND (${t.price} IS NOT NULL AND ${t.price} > 0))`
    ),
  ]
);

export const classSchedules = mysqlTable(
  "class_schedules",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    classId: varchar("class_id", { length: 36 })
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
  ]
);

// Concrete class sessions
export const classOccurrences = mysqlTable("class_occurrences", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  scheduleId: varchar("schedule_id", { length: 36 })
    .notNull()
    .references(() => classSchedules.id),
  classId: varchar("class_id", { length: 36 })
    .notNull()
    .references(() => classes.id), // denormalized for faster queries

  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),

  status: mysqlEnum(ClassOccurrenceStatus)
    .notNull()
    .default(ClassOccurrenceStatus.Scheduled),
  cancellationReason: varchar("cancellation_reason", { length: 500 }),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const deletionRequests = mysqlTable("deletion_requests", {
  id: int().autoincrement().primaryKey(),
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
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    ownerUserId: varchar("owner_user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    tag: varchar("tag", { length: 50 }).unique().notNull(),
    tagline: varchar("tagline", { length: 255 }).notNull(),
    status: mysqlEnum(DojoStatus).notNull(),
    activeSub: mysqlEnum("active_sub", StripePlans).notNull(),
    hasUsedTrial: boolean("has_used_trial").notNull().default(false),
    trialEndsAt: datetime("trial_ends_at"),
    referralCode: varchar("referral_code", { length: 255 }).notNull(),
    referredBy: varchar("referred_by", { length: 255 }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => []
);

export const dojoSubscriptions = mysqlTable(
  "dojo_subscriptions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    dojoId: varchar("dojo_id", { length: 36 })
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
    activeDojoId: varchar("active_dojo_id", { length: 36 }).generatedAlwaysAs(
      sql`
        CASE
          WHEN billing_status IN (${activeBillingStatusesSql})
          THEN dojo_id
          ELSE NULL
        END
      `
    ),
  },
  (table) => [
    uniqueIndex("one_active_subscription_per_user").on(table.activeDojoId),
  ]
);

export const enrolledChildren = mysqlTable(
  "enrolled_children",
  {
    id: int().autoincrement().primaryKey(),
    enrollmentId: varchar("enrollment_id", { length: 50 }).notNull(),
    childName: varchar("child_name", { length: 100 }).notNull(),
    childEmail: varchar("child_email", { length: 100 }).notNull(),
    experienceLevel: varchar("experience_level", { length: 50 }).notNull(),
  },
  (table) => [index("enrollment_id").on(table.enrollmentId)]
);

export const enrollments = mysqlTable(
  "enrollments",
  {
    id: int().autoincrement().primaryKey(),
    enrollmentId: varchar("enrollment_id", { length: 50 }).notNull(),
    classId: varchar("class_id", { length: 50 }).notNull(),
    parentEmail: varchar("parent_email", { length: 100 }).notNull(),
    createdAt: datetime("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [unique("enrollment_id").on(table.enrollmentId)]
);

export const events = mysqlTable("events", {
  id: int().autoincrement().primaryKey(),
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
  responseStatus: varchar("response_status", { length: 121 })
    .default("pending")
    .notNull(),
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
  id: int().autoincrement().primaryKey(),
  userEmail: varchar("user_email", { length: 255 }),
  message: text(),
  fullName: varchar("full_name", { length: 255 }),
  role: varchar({ length: 100 }),
  submittedAt: timestamp("submitted_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const instructorInvites = mysqlTable("instructor_invites", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 150 }).notNull(),
  dojoId: varchar("dojo_id", { length: 36 })
    .notNull()
    .references(() => dojos.id, { onDelete: "cascade" }),
  classId: varchar("class_id", { length: 36 }).references(() => classes.id, {
    onDelete: "cascade",
  }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), // secure random token
  status: mysqlEnum(InstructorInviteStatus)
    .default(InstructorInviteStatus.Pending)
    .notNull(),
  invitedBy: varchar("invited_by", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  respondedAt: timestamp("responded_at"),
});

export const dojoInstructors = mysqlTable("dojo_instructors", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  instructorUserId: varchar("instructor_user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  dojoId: varchar("dojo_id", { length: 36 })
    .notNull()
    .references(() => dojos.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (table) => [index("dojo_id").on(table.dojoId), index("instructor_user_id").on(table.instructorUserId), uniqueIndex("unique_dojo_instructor").on(table.dojoId, table.instructorUserId)]);

export const messages = mysqlTable(
  "messages",
  {
    id: int().autoincrement().primaryKey(),
    chatId: int("chat_id").notNull(),
    senderId: int("sender_id").notNull(),
    message: text().notNull(),
    createdAt: datetime("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("idx_messages_chat_id").on(table.chatId),
    index("idx_messages_sender_id").on(table.senderId),
  ]
);

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }),
  message: text(),
  isRead: boolean("is_read").default(false),
  createdAt: datetime("created_at", { mode: "string" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  type: mysqlEnum(NotificationType),
  eventId: varchar("event_id", { length: 121 }),
  acceptDecline: varchar("accept_decline", { length: 20 }),
  status: varchar({ length: 20 }).default("pending"),
});

export const userOAuthAccounts = mysqlTable(
  "user_oauth_accounts",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: mysqlEnum(SupportedOAuthProviders).notNull(),
    providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
    profileData: json("profile_data"),
    createdAt: timestamp("created_at",)
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at",)
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    unique("provider_user_unique").on(table.provider, table.providerUserId),
  ]
);

export const parents = mysqlTable(
  "parents",
  {
    id: int().autoincrement().primaryKey(),
    email: varchar({ length: 255 }).notNull(),
    enrollmentId: varchar("enrollment_id", { length: 255 }).default(""),
    classId: varchar("class_id", { length: 255 }).default(""),
  },
  (table) => [
    unique("unique_parent_enrollment").on(
      table.email,
      table.enrollmentId,
      table.classId
    ),
  ]
);

export const passwordResetOTPs = mysqlTable("password_reset_otps", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hashedOTP: varchar("hashed_otp", { length: 255 }).notNull(),
  attempts: int("attempts").default(0).notNull(),
  expiresAt: datetime("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  blockedAt: datetime("blocked_at"), // Block after max attempts
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = mysqlTable(
  "sessions",
  {
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    userEmail: varchar("user_email", { length: 255 }).notNull(),
    userIp: varchar("user_ip", { length: 50 }),
    userAgent: text("user_agent"),
    createdAt: datetime("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    expiresAt: datetime("expires_at", { mode: "string" }).notNull(),
  },
  (table) => [index("user_email").on(table.userEmail)]
);

// We store refresh tokens to allow revocation (banning a user/device)
export const refreshTokens = mysqlTable("refresh_tokens", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: varchar("user_id", { length: 36 })
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
    id: int().autoincrement().primaryKey(),
    fullName: varchar("full_name", { length: 255 }),
    email: varchar({ length: 255 }),
    classId: varchar("class_id", { length: 255 }),
    addedBy: varchar("added_by", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [unique("email").on(table.email)]
);

export const tasks = mysqlTable("tasks", {
  id: int().autoincrement().primaryKey(),
  title: varchar({ length: 255 }),
  description: text(),
  assignedTo: varchar("assigned_to", { length: 255 }),
  createdBy: varchar("created_by", { length: 255 }),
  dueDate: datetime("due_date", { mode: "string" }),
  notificationValue: varchar("notification_value", { length: 10 }),
  notificationUnit: varchar("notification_unit", { length: 10 }),
  status: mysqlEnum([
    "pending",
    "in_progress",
    "completed",
    "declined",
  ]).default("pending"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

export const transactions = mysqlTable("transactions", {
  id: int().autoincrement().primaryKey(),
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
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    firstName: varchar({ length: 100 }).notNull(),
    lastName: varchar({ length: 100 }).notNull(),
    email: varchar({ length: 150 }).unique().notNull(),
    username: varchar({ length: 100 }).unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    emailVerified: boolean("email_verified").default(false).notNull(),
    avatar: text(),
    role: mysqlEnum(Role).notNull(),
    balance: decimal({ precision: 10, scale: 2 }).default("0.00").notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    dob: varchar({ length: 20 }),
    gender: varchar({ length: 10 }),
    city: varchar({ length: 50 }),
    street: varchar({ length: 100 }),
    fcmToken: text("fcm_token"),
    sessionId: varchar("session_id", { length: 255 }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => []
);

export const userCards = mysqlTable("user_cards", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: varchar("user_id", { length: 36 })
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
    id: int().autoincrement().primaryKey(),
    fullname: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [unique("email").on(table.email)]
);
