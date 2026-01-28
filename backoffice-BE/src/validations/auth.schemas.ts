// Use zod for schema validation
import { z } from "zod";
import { StripePlans } from "../constants/enums.js";
import { DateOnlySchema } from "./helpers.schemas.js";

export const LoginSchema = z.object({
  email: z.email().trim(),
  password: z.string().trim().nonempty(),
  fcmToken: z.string().trim().optional().nullable(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().trim().nonempty(),
});

export const PasswordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  // at least one lowercase, one uppercase, one digit, one special char, no spaces
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`])\S+$/,
    "Password must contain uppercase, lowercase, number, and special character; and contain no spaces",
  );

export const CreateUserBaseSchema = z.object({
  firstName: z.string().trim().nonempty(),
  lastName: z.string().trim().nonempty(),
  username: z.string().trim().nonempty(),
  email: z.email().trim(),
  password: PasswordSchema,
  fcmToken: z.string().trim().optional().nullable(),
});

export const RegisterDojoAdminSchema = CreateUserBaseSchema.extend({
  referredBy: z.string().trim().optional().default(""),
  plan: z.enum(StripePlans),
  dojoName: z.string().trim().nonempty(),
  dojoTag: z.string().trim().nonempty(),
  dojoTagline: z.string().trim().nonempty(),
});

// RegisterParentSchema uses CreateUserBaseSchema which matches requirements (no username)
export const RegisterParentSchema = CreateUserBaseSchema;

export const FirebaseSignInSchema = z.object({
  idToken: z.string().trim().nonempty(),
  fcmToken: z.string().trim().optional().nullable(),
});

const OnlyEmailSchema = z.object({
  email: z.email().trim(),
});

export const ForgotPasswordSchema = OnlyEmailSchema;

const OtpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP must be exactly 6 digits");

export const VerifyPasswordResetOtpSchema = z.object({
  email: z.email().trim(),
  otp: OtpSchema,
});

export const VerifyEmailOtpSchema = z.object({
  otp: OtpSchema,
});

export const ResetPasswordSchema = z.object({
  resetToken: z.string().trim().nonempty(),
  newPassword: PasswordSchema,
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().trim().nonempty(),
  newPassword: PasswordSchema,
});

export type CreateUserBaseDTO = z.infer<typeof CreateUserBaseSchema> & {
  dob?: z.infer<typeof DateOnlySchema>;
};
export type RegisterParentDTO = z.infer<typeof RegisterParentSchema>;
export type RegisterDojoAdminDTO = z.infer<typeof RegisterDojoAdminSchema>;
export type LoginDTO = z.infer<typeof LoginSchema>;
export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>;
export type FirebaseSignInDTO = z.infer<typeof FirebaseSignInSchema>;
export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;
export type VerifyPasswordResetOtpDTO = z.infer<typeof VerifyPasswordResetOtpSchema>;
export type VerifyEmailOtpDTO = z.infer<typeof VerifyEmailOtpSchema>;
export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>;
