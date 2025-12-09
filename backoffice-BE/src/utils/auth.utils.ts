// src/utils/auth.ts
import jwt from "jsonwebtoken";
import argon2 from "@node-rs/argon2";
import crypto from "crypto";
import AppConfig from "../config/AppConfig";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  // Keep payload minimal - don't include sensitive data
}

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
