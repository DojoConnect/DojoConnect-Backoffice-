import jwt from "jsonwebtoken";
import argon2 from "@node-rs/argon2";
import crypto from "crypto";
import * as authUtils from "./auth.utils.js";
import AppConfig from "../config/AppConfig.js";
import { BadRequestException } from "../core/errors/index.js";

describe("Auth Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.replaceProperty(AppConfig, "JWT_ACCESS_SECRET", "test-secret-key");
  });

  describe("hashPassword", () => {
    it("should hash the password using argon2", async () => {
      const mockHash = "hashed_password";
      const spy = jest.spyOn(argon2, "hash").mockResolvedValue(mockHash);

      const result = await authUtils.hashPassword("password123");

      expect(spy).toHaveBeenCalledWith("password123");
      expect(result).toBe(mockHash);
    });
  });

  describe("verifyPassword", () => {
    it("should verify the password using argon2", async () => {
      const spy = jest.spyOn(argon2, "verify").mockResolvedValue(true);

      const result = await authUtils.verifyPassword("hash", "plain");

      expect(spy).toHaveBeenCalledWith("hash", "plain");
      expect(result).toBe(true);
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a random hex string", () => {
      const mockBuffer = {
        toString: jest.fn().mockReturnValue("random_hex_string"),
      };
      // @ts-ignore - mocking internal implementation details of Buffer
      const spy = jest
        .spyOn(crypto, "randomBytes")
        .mockReturnValue(mockBuffer as any);

      const result = authUtils.generateRefreshToken();

      expect(spy).toHaveBeenCalledWith(64);
      expect(mockBuffer.toString).toHaveBeenCalledWith("hex");
      expect(result).toBe("random_hex_string");
    });
  });

  describe("generateAccessToken", () => {
    it("should generate a JWT access token", () => {
      const mockToken = "access_token";
      const spy = jest
        .spyOn(jwt, "sign")
        .mockImplementation(() => mockToken as any);
      const payload = { userId: "1", email: "test@example.com", role: "user" };

      const result = authUtils.generateAccessToken(payload);

      expect(spy).toHaveBeenCalledWith(payload, "test-secret-key", {
        expiresIn: "15m",
      });
      expect(result).toBe(mockToken);
    });
  });

  describe("hashToken", () => {
    it("should hash a token using sha256", () => {
      const mockHashObject = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue("hashed_token_hex"),
      };
      // @ts-ignore - mocking crypto.Hash
      const spy = jest
        .spyOn(crypto, "createHash")
        .mockReturnValue(mockHashObject as any);

      const result = authUtils.hashToken("raw_token");

      expect(spy).toHaveBeenCalledWith("sha256");
      expect(mockHashObject.update).toHaveBeenCalledWith("raw_token");
      expect(mockHashObject.digest).toHaveBeenCalledWith("hex");
      expect(result).toBe("hashed_token_hex");
    });
  });

  describe("generateOTP", () => {
    it("should generate a 6-digit OTP string", () => {
      const spy = jest.spyOn(crypto, "randomInt");

      const result = authUtils.generateOTP();

      expect(spy).toHaveBeenCalledWith(100000, 1000000);
      expect(Number(result)).toBeGreaterThanOrEqual(100000);
      expect(Number(result)).toBeLessThanOrEqual(999999);
    });
  });

  describe("generatePasswordResetToken", () => {
    it("should generate a password reset token with correct scope", () => {
      const mockToken = "reset_token";
      const spy = jest
        .spyOn(jwt, "sign")
        .mockImplementation(() => mockToken as any);
      const userId = "user_123";

      const result = authUtils.generatePasswordResetToken(userId);

      expect(spy).toHaveBeenCalledWith(
        { userId, scope: authUtils.PASSWORD_RESET_SCOPE },
        "test-secret-key",
        { expiresIn: "5m" }
      );
      expect(result).toBe(mockToken);
    });
  });

  describe("verifyPasswordResetToken", () => {
    it("should return payload if token is valid and scope is correct", () => {
      const mockPayload = {
        userId: "user_123",
        scope: authUtils.PASSWORD_RESET_SCOPE,
      };
      const spy = jest
        .spyOn(jwt, "verify")
        .mockImplementation(() => mockPayload as any);

      const result = authUtils.verifyPasswordResetToken("valid_token");

      expect(spy).toHaveBeenCalledWith("valid_token", "test-secret-key");
      expect(result).toEqual(mockPayload);
    });

    it("should throw BadRequestException if token verification fails", () => {
      jest.spyOn(jwt, "verify").mockImplementation(() => {
        throw new Error("jwt expired");
      });
      expect(() => authUtils.verifyPasswordResetToken("expired_token")).toThrow(
        BadRequestException
      );
      expect(() => authUtils.verifyPasswordResetToken("expired_token")).toThrow(
        "Reset token expired. Please verify OTP again."
      );
    });

    it("should throw BadRequestException if token scope is invalid", () => {
      const mockPayload = { userId: "user_123", scope: "wrong_scope" };
      jest.spyOn(jwt, "verify").mockImplementation(() => mockPayload as any);
      expect(() =>
        authUtils.verifyPasswordResetToken("wrong_scope_token")
      ).toThrow(BadRequestException);
      expect(() =>
        authUtils.verifyPasswordResetToken("wrong_scope_token")
      ).toThrow("Invalid token type");
    });
  });
});
