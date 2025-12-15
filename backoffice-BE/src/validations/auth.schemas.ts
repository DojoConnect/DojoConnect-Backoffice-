// Use zod for schema validation
import { z } from "zod";
import { Role, StripePlans } from "../constants/enums";

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

export const RegisterUserSchema = z.object({
  fullName: z.string().trim().nonempty(),

  username: z.string().trim().nonempty(),

  email: z.string().trim().email().nonempty(),

  password: PasswordSchema,

  role: z.nativeEnum(Role),

  referredBy: z.string().trim().optional().default(""),

  plan: z.nativeEnum(StripePlans).optional().default(StripePlans.Trial),
  paymentMethod: z.string().trim().nonempty(),

  dojoName: z.string().trim().nonempty(),
  dojoTag: z.string().trim().nonempty(),
  dojoTagline: z.string().trim().nonempty(),
});

export const IsUsernameAvailableSchema = z.object({
  username: z.string().trim().nonempty(),
});

export const FirebaseSignInSchema = z.object({
  idToken: z.string().trim().nonempty(),
  fcmToken: z.string().trim().optional().nullable()
});

export type RegisterUserDTO = z.infer<typeof RegisterUserSchema>;
export type LoginDTO = z.infer<typeof LoginSchema>;
export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>;
export type FirebaseSignInDTO = z.infer<typeof FirebaseSignInSchema>;
