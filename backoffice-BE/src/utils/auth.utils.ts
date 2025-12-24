// src/utils/auth.ts
import jwt from "jsonwebtoken";
import argon2 from "@node-rs/argon2";
import crypto from "crypto";
import AppConfig from "../config/AppConfig.js";
import { BadRequestException } from "../core/errors/index.js";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  // Keep payload minimal - don't include sensitive data
}

export interface PasswordResetTokenPayload {
  userId: string;
  scope: string;
}

export const PASSWORD_RESET_SCOPE = "password_reset";

export const hashPassword = async (password: string) => {
  return await argon2.hash(password);
};

export const verifyPassword = async (hash: string, plain: string) => {
  return await argon2.verify(hash, plain);
};

// Generate a random opaque string for the refresh token (better than JWT for refresh tokens)
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(payload, AppConfig.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

export const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateOTP = () => {
  // Generates a cryptographically strong integer between 100000 and 999999
  const otp = crypto.randomInt(100000, 1000000).toString();
  return otp;
};

export const generatePasswordResetToken = (userId: string) => {
  const payload: PasswordResetTokenPayload = {
    userId,
    scope: PASSWORD_RESET_SCOPE, // Critical: This token cannot be used for login!
  };
  return jwt.sign(payload, AppConfig.JWT_ACCESS_SECRET, { expiresIn: "5m" });
};

export const verifyPasswordResetToken = (
  resetToken: string
): PasswordResetTokenPayload => {
  // A. Verify the JWT
  let payload: PasswordResetTokenPayload;
  try {
    payload = jwt.verify(
      resetToken,
      AppConfig.JWT_ACCESS_SECRET
    ) as PasswordResetTokenPayload;
  } catch (err) {
    throw new BadRequestException(
      "Reset token expired. Please verify OTP again."
    );
  }

  // B. Security Check: Ensure this is a RESET token, not a login token
  if (payload.scope !== PASSWORD_RESET_SCOPE) {
    throw new BadRequestException("Invalid token type");
  }

  return payload;
};

export const generateInviteToken = () => {
  return crypto.randomBytes(32).toString("hex");
}
