export enum NodeEnv {
  Development = "development",
  Production = "production",
  Test = "test",
}

export enum AppointmentStatus {
  Pending = "pending",
  Upcoming = "upcoming",
  Completed = "completed",
}

export enum AppointmentType {
  Physical = "physical",
  Online = "online",
}

export enum NotificationType {
  Event = "event",
  ClassCreated = "class_created",
  ClassUpdated = "class_updated",
  ClassDeleted = "class_deleted",
  InvitationCreated = "invitation_created",
  InvitationResponse = "invitation_response",
  InvitationAccepted = "invitation_accepted",
  Message = "message",
  SignUp = "signup",
}

export enum Role {
  DojoAdmin = "dojo-admin",
  Instructor = "instructor",
  Parent = "parent",
  Child = "child",
}

export enum StripePlans {
  Monthly = "monthly",
  Yearly = "yearly",
}

export enum SupportedOAuthProviders {
  Google = "google",
}

export enum DojoStatus {
  Registered = "registered",
  OnboardingIncomplete = "onboarding_incomplete",
  Trailing = "trialing",
  Active = "active",
  PastDue = "past_due",
  Blocked = "blocked",
}

export enum BillingStatus {
  NoCustomer = "no_customer",
  CustomerCreated = "customer_created",
  SetupIntentCreated = "setup_intent_created",
  PaymentMethodAttached = "payment_method_attached",
  SubscriptionCreated = "subscription_created",
  Trialing = "trialing",
  Active = "active",
  PastDue = "past_due",
  Unpaid = "unpaid",
  Cancelled = "cancelled",
}

export enum StripeSetupIntentStatus {
  Canceled = "canceled",
  Processing = "processing",
  RequiresAction = "requires_action",
  RequiresConfirmation = "requires_confirmation",
  RequiresPaymentMethod = "requires_payment_method",
  Succeeded = "succeeded",
}

export enum StripeSubscriptionStatus {
  Incomplete = "incomplete",
  IncompleteExpired = "incomplete_expired",
  Trialing = "trialing",
  Active = "active",
  PastDue = "past_due",
  Canceled = "canceled",
  Unpaid = "unpaid",
  Paused = "paused",
}

export enum InstructorInviteStatus {
  Pending = "pending",
  Accepted = "accepted",
  Declined = "declined",
  Expired = "expired",
}

export enum ClassLevel {
  Beginner = "beginner",
  Intermediate = "intermediate",
  Advanced = "advanced",
}

export enum ClassStatus {
  Active = "active",
  Deleted = "deleted",
  Hidden = "hidden",
}

export enum ClassFrequency {
  OneTime = "one_time",
  Weekly = "weekly",
}

export enum ClassSubscriptionType {
  Free = "free",
  Paid = "paid",
}

export enum Weekday {
  Sunday = "sunday",
  Monday = "monday",
  Tuesday = "tuesday",
  Wednesday = "wednesday",
  Thursday = "thursday",
  Friday = "friday",
  Saturday = "saturday",
}

export enum ClassOccurrenceStatus {
  Scheduled = "scheduled",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum GradingNotificationUnit {
  Hours = "hours",
  Days = "days",
  Weeks = "weeks",
}

export const ACTIVE_BILLING_STATUSES = [
  BillingStatus.Trialing,
  BillingStatus.Active,
  BillingStatus.PastDue,
] as const;
