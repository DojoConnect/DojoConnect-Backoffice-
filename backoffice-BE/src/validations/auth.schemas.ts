// Use zod for schema validation
import { z } from "zod";
import { Role, StripePlans } from "../constants/enums.js";

export const LoginSchema = z.object({
  email: z.string().trim().email(),
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
    "Password must contain uppercase, lowercase, number, and special character; and contain no spaces"
  );

export const RegisterDojoAdminSchema = z.object({
  fullName: z.string().trim().nonempty(),

  email: z.string().trim().email().nonempty(),
  password: PasswordSchema,
  username: z.string().trim().nonempty(),

  referredBy: z.string().trim().optional().default(""),

  plan: z.nativeEnum(StripePlans),
  dojoName: z.string().trim().nonempty(),
  dojoTag: z.string().trim().nonempty(),
  dojoTagline: z.string().trim().nonempty(),
});

export const FirebaseSignInSchema = z.object({
  idToken: z.string().trim().nonempty(),
  fcmToken: z.string().trim().optional().nullable(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const VerifyOtpSchema = z.object({
  email: z.string().trim().email(),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

export const ResetPasswordSchema = z.object({
  resetToken: z.string().trim().nonempty(),
  newPassword: PasswordSchema,
});

export type RegisterDojoAdminDTO = z.infer<typeof RegisterDojoAdminSchema>;
export type LoginDTO = z.infer<typeof LoginSchema>;
export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>;
export type FirebaseSignInDTO = z.infer<typeof FirebaseSignInSchema>;
export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;
export type VerifyOtpDTO = z.infer<typeof VerifyOtpSchema>;
export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;
