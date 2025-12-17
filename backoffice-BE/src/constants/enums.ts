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
  Invitation = "invitation",
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
  Trial = "trial",
  Starter = "starter",
  Pro = "pro",
}

export enum SupportedOAuthProviders {
  Google = "google",
}
