import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock, MockInstance } from "vitest";
import { SupportedOAuthProviders } from "../constants/enums.js";
import { UnauthorizedException } from "../core/errors/index.js";
import { buildDecodedIdTokenMock } from "../tests/factories/firebase.factory.js";
import { FirebaseService } from "./firebase.service.js";

describe("Firebase Service", () => {
  describe("verifyFirebaseToken", () => {
    let verifyIdTokenSpy: MockInstance;

    const mockVerifyIdToken = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();

      /**
       * Spy on getFirebaseAuth instead of mocking firebase-admin directly.
       * This keeps the test close to real behavior and avoids brittle mocks.
       */
      verifyIdTokenSpy = vi.spyOn(FirebaseService, "getFirebaseAuth").mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      } as any);
    });

    afterEach(() => {
      verifyIdTokenSpy.mockRestore();
    });

    it("should successfully verify a valid Firebase token", async () => {
      mockVerifyIdToken.mockResolvedValue(
        buildDecodedIdTokenMock({
          uid: "firebase-uid",
          email: "user@example.com",
          name: "John Doe",
          picture: "https://avatar.com/pic.png",
          email_verified: true,
          signInProvider: `${SupportedOAuthProviders.Google}.com`,
        }),
      );

      const result = await FirebaseService.verifyFirebaseToken("valid-token");

      expect(result).toEqual({
        uid: "firebase-uid",
        email: "user@example.com",
        name: "John Doe",
        picture: "https://avatar.com/pic.png",
        emailVerified: true,
        provider: SupportedOAuthProviders.Google,
      });

      expect(mockVerifyIdToken).toHaveBeenCalledWith("valid-token");
    });

    it("should throw UnauthorizedException if decoded token is null", async () => {
      mockVerifyIdToken.mockResolvedValue(null);

      await expect(FirebaseService.verifyFirebaseToken("invalid-token")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      await expect(FirebaseService.verifyFirebaseToken("invalid-token")).rejects.toThrow(
        "Invalid Token",
      );
    });

    it("should throw UnauthorizedException for unsupported auth provider", async () => {
      mockVerifyIdToken.mockResolvedValue(
        buildDecodedIdTokenMock({
          uid: "uid",
          email: "user@example.com",
          signInProvider: "unknown.com",
        }),
      );

      await expect(FirebaseService.verifyFirebaseToken("token")).rejects.toThrow(
        "Unsupported Auth provider",
      );
    });

    it("should throw UnauthorizedException when email is missing", async () => {
      mockVerifyIdToken.mockResolvedValue(
        buildDecodedIdTokenMock({
          uid: "uid",
          signInProvider: `${SupportedOAuthProviders.Google}.com`,
          email: undefined,
        }),
      );

      await expect(FirebaseService.verifyFirebaseToken("token")).rejects.toThrow(
        "Email not provided by auth provider",
      );
    });

    it("should rethrow HttpException errors from Firebase", async () => {
      const httpError = new UnauthorizedException("Token expired");

      mockVerifyIdToken.mockRejectedValue(httpError);

      await expect(FirebaseService.verifyFirebaseToken("expired-token")).rejects.toBe(httpError);
    });

    it("should wrap non-HttpException errors in UnauthorizedException", async () => {
      mockVerifyIdToken.mockRejectedValue(new Error("Firebase internal error"));

      await expect(FirebaseService.verifyFirebaseToken("token")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      await expect(FirebaseService.verifyFirebaseToken("token")).rejects.toThrow(
        "Authentication failed",
      );
    });

    it("should default emailVerified to false when not provided", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "uid",
        email: "user@example.com",
        signInProvider: `${SupportedOAuthProviders.Google}.com`,
      });

      const result = await FirebaseService.verifyFirebaseToken("token");

      expect(result.emailVerified).toBe(false);
    });
  });
});
