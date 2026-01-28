export enum OtpType {
  PasswordReset = "password_reset",
  EmailVerification = "email_verification",
  EmailUpdate = "email_update",
}

export enum OtpStatus {
    Pending = "pending",
    Used = "used",
    Revoked = "revoked",
}