import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { MockInstance } from "vitest";

import { AuthService } from "./auth.service.js";
import * as dbService from "../db/index.js";
import { UsersService } from "./users.service.js";
import { StripeService } from "./stripe.service.js";
import { DojosService } from "./dojos.service.js";
import { MailerService } from "./mailer.service.js";
import * as authUtils from "../utils/auth.utils.js";
import { FirebaseService } from "./firebase.service.js";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import { buildStripeCustMock, buildStripeSubMock } from "../tests/factories/stripe.factory.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  TooManyRequestsException,
} from "../core/errors/index.js";
import { Role, StripePlans, SupportedOAuthProviders } from "../constants/enums.js";
import { addDays, subDays } from "date-fns";
import { refreshTokens } from "../db/schema.js";
import { eq } from "drizzle-orm";
import {
  buildChangePasswordDTOMock,
  buildEmailUpdateRequestMock,
  buildIOtpMock,
  buildLoginDTOMock,
  buildOAuthAcctMock,
  buildRefreshTokenDtoMock,
  buildRefreshTokenMock,
  buildRegisterDojoAdminDTOMock,
  buildRegisterParentDTOMock,
} from "../tests/factories/auth.factory.js";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";
import { UserDTO } from "../dtos/user.dtos.js";
import { buildFirebaseUserMock } from "../tests/factories/firebase.factory.js";
import { UserOAuthAccountsRepository } from "../repositories/oauth-providers.repository.js";
import { OTPRepository } from "../repositories/otps.repository.js";
import AppConstants from "../constants/AppConstants.js";
import { AuthResponseDTO } from "../dtos/auth.dtos.js";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository.js";
import { SubscriptionService } from "./subscription.service.js";
import { NotificationService } from "./notifications.service.js";
import { BaseDojoDTO } from "../dtos/dojo.dtos.js";
import { buildParentMock } from "../tests/factories/parent.factory.js";
import { ParentRepository } from "../repositories/parent.repository.js";
import { OtpStatus, OtpType, EmailUpdateStatus } from "../core/constants/auth.constants.js";
import { EmailUpdateRequestRepository } from "../repositories/email-update-request.repository.js";
import { IUser } from "../repositories/user.repository.js";

describe("Auth Service", () => {
  let dbSpies: DbServiceSpies;
  let logSpy: MockInstance;
  const mockDojo = buildDojoMock({ name: "Test Dojo" });
  const mockDojoDTO = new BaseDojoDTO(mockDojo);

  const mockStripeCustomer = buildStripeCustMock();

  let getOneUserByEmailSpy: MockInstance;
  let getOneUserByUsernameSpy: MockInstance;
  let getOneDojoByTagSpy: MockInstance;
  let saveUserSpy: MockInstance;
  let getOneUserByIDSpy: MockInstance;
  let createStripeCustomerSpy: MockInstance;
  let getUserDojoSpy: MockInstance;

  beforeEach(() => {
    dbSpies = createDrizzleDbSpies();

    getOneUserByEmailSpy = vi.spyOn(UsersService, "getOneUserByEmail");
    getOneUserByIDSpy = vi.spyOn(UsersService, "getOneUserByID");
    getOneUserByUsernameSpy = vi.spyOn(UsersService, "getOneUserByUserName");
    getOneDojoByTagSpy = vi.spyOn(DojosService, "getOneDojoByTag");
    saveUserSpy = vi.spyOn(UsersService, "saveUser");
    getUserDojoSpy = vi.spyOn(DojosService, "fetchUserDojo").mockResolvedValue(mockDojo);
    vi.spyOn(UsersService, "getUserDTO").mockImplementation(
      async (user: IUser) => new UserDTO(user) as any,
    );

    createStripeCustomerSpy = vi
      .spyOn(StripeService, "createCustomer")
      .mockResolvedValue(mockStripeCustomer as any);

    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(OTPRepository, "revokeUserPendingOTPs").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generateAuthTokens", () => {
    const mockUser = buildUserMock({ role: Role.DojoAdmin });

    let generateAccessTokenSpy: MockInstance;
    let generateRefreshTokenSpy: MockInstance;
    let hashTokenSpy: MockInstance;

    beforeEach(() => {
      generateAccessTokenSpy = vi
        .spyOn(authUtils, "generateAccessToken")
        .mockReturnValue("access_token");
      generateRefreshTokenSpy = vi
        .spyOn(authUtils, "generateRefreshToken")
        .mockReturnValue("refresh_token");
      hashTokenSpy = vi.spyOn(authUtils, "hashToken").mockReturnValue("hashed_refresh_token");
    });

    it("should generate and save tokens, returning the raw tokens", async () => {
      const result = await AuthService.generateAuthTokens({ user: mockUser });

      expect(generateAccessTokenSpy).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(generateRefreshTokenSpy).toHaveBeenCalled();
      expect(hashTokenSpy).toHaveBeenCalledWith("refresh_token");
      expect(dbSpies.mockInsert).toHaveBeenCalledWith(refreshTokens);
      expect(dbSpies.mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          hashedToken: "hashed_refresh_token",
        }),
      );
      expect(result).toEqual({
        accessToken: "access_token",
        refreshToken: "refresh_token",
      });
    });
  });

  describe("loginUser", () => {
    const loginDTO = buildLoginDTOMock({
      email: "test@test.com",
      password: "password123",
    });

    const mockUser = buildUserMock({
      ...loginDTO,
      passwordHash: "hashed_password",
    });

    let verifyPasswordSpy: MockInstance;
    let updateUserSpy: MockInstance;
    let generateAuthTokensSpy: MockInstance;

    beforeEach(() => {
      verifyPasswordSpy = vi.spyOn(authUtils, "verifyPassword");
      updateUserSpy = vi.spyOn(UsersService, "updateUser").mockResolvedValue();
      generateAuthTokensSpy = vi.spyOn(AuthService, "generateAuthTokens").mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });
    });

    it("should successfully log in a user and return tokens and user data", async () => {
      getOneUserByEmailSpy.mockResolvedValue(mockUser);
      verifyPasswordSpy.mockResolvedValue(true);

      const result = await AuthService.loginUser({ dto: loginDTO });

      expect(getOneUserByEmailSpy).toHaveBeenCalledWith({
        email: loginDTO.email,
        txInstance: dbSpies.mockTx,
        withPassword: true,
      });
      expect(verifyPasswordSpy).toHaveBeenCalledWith("hashed_password", "password123");
      expect(updateUserSpy).toHaveBeenCalledWith({
        userId: mockUser.id,
        update: { fcmToken: loginDTO.fcmToken },
        txInstance: dbSpies.mockTx,
      });
      expect(generateAuthTokensSpy).toHaveBeenCalled();
      expect(result).toBeInstanceOf(AuthResponseDTO);
      expect(result.toJSON()).toEqual({
        accessToken: "access",
        refreshToken: "refresh",
        user: new UserDTO({
          ...mockUser,
        }).toJSON(),
      });
    });

    it("should not update user if fcmToken is not provided", async () => {
      const noFcmTokenDTO = { ...loginDTO, fcmToken: undefined };
      await AuthService.loginUser({ dto: noFcmTokenDTO });
      expect(updateUserSpy).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if user is not found", async () => {
      getOneUserByEmailSpy.mockResolvedValue(null);
      await expect(AuthService.loginUser({ dto: loginDTO })).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      getOneUserByEmailSpy.mockResolvedValue(mockUser);
      verifyPasswordSpy.mockResolvedValue(false);
      await expect(AuthService.loginUser({ dto: loginDTO })).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if password is empty or undefined", async () => {
      getOneUserByEmailSpy.mockResolvedValue(
        buildUserMock({
          ...mockUser,
          passwordHash: undefined,
        }),
      );

      await expect(AuthService.loginUser({ dto: loginDTO })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("getAuthResponseDTO", () => {
    const mockUser = buildUserMock({ id: "user-123" });
    const authTokens = { accessToken: "access", refreshToken: "refresh" };

    beforeEach(() => {
      vi.spyOn(AuthService, "generateAuthTokens").mockResolvedValue(authTokens);
    });

    it("should return an AuthResponseDTO with correct data", async () => {
      const result = await AuthService.getAuthResponseDTO({ user: mockUser });

      expect(result).toBeInstanceOf(AuthResponseDTO);
      expect(result.accessToken).toBe(authTokens.accessToken);
      expect(result.refreshToken).toBe(authTokens.refreshToken);
      expect(result.userDto.id).toBe(mockUser.id);
    });

    it("should use provided transaction instance", async () => {
      const tx = dbSpies.mockTx;
      await AuthService.getAuthResponseDTO({ user: mockUser, txInstance: tx });

      expect(AuthService.generateAuthTokens).toHaveBeenCalledWith(
        expect.objectContaining({ txInstance: tx }),
      );
      expect(UsersService.getUserDTO).toHaveBeenCalledWith(mockUser, tx);
    });
  });

  describe("revokeRefreshToken", () => {
    const mockUser = buildUserMock();
    const storedToken = buildRefreshTokenMock({
      id: "token-id",
      userId: mockUser.id,
      hashedToken: "hashed_token",
      revoked: false,
      expiresAt: addDays(new Date(), 1),
    });
    const hashedToken = "hashed_token";
    const dto = buildRefreshTokenDtoMock({ refreshToken: "raw_refresh_token" });

    let hashTokenSpy: MockInstance;
    let getOneRefreshTokenSpy: MockInstance;

    beforeEach(() => {
      vi.clearAllMocks();

      hashTokenSpy = vi.spyOn(authUtils, "hashToken").mockReturnValue(hashedToken);

      getOneRefreshTokenSpy = vi
        .spyOn(RefreshTokenRepository, "getOne")
        .mockResolvedValue(storedToken);
    });

    it("should successfully revoke a valid token", async () => {
      const result = await AuthService.revokeRefreshToken({ dto });

      expect(hashTokenSpy).toHaveBeenCalledWith(dto.refreshToken);
      expect(getOneRefreshTokenSpy).toHaveBeenCalledWith(hashedToken, expect.anything());
      expect(dbSpies.mockDelete).toHaveBeenCalledWith(refreshTokens);
      expect(dbSpies.mockWhere).toHaveBeenCalledWith(eq(refreshTokens.id, storedToken.id));
      expect(result).toEqual(storedToken);
    });

    it("should throw UnauthorizedException if token is not found", async () => {
      getOneRefreshTokenSpy.mockResolvedValue(null);
      await expect(AuthService.revokeRefreshToken({ dto })).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if token is already revoked", async () => {
      getOneRefreshTokenSpy.mockResolvedValue({
        ...storedToken,
        revoked: true,
      });
      await expect(AuthService.revokeRefreshToken({ dto })).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if token is expired", async () => {
      getOneRefreshTokenSpy.mockResolvedValue({
        ...storedToken,
        expiresAt: subDays(new Date(), 1),
      });
      await expect(AuthService.revokeRefreshToken({ dto })).rejects.toThrow(UnauthorizedException);
    });

    it("should use provided transaction instance", async () => {
      await AuthService.revokeRefreshToken({ dto, txInstance: dbSpies.mockTx });
      expect(dbService.runInTransaction).not.toHaveBeenCalled();
    });
  });

  describe("refreshAccessToken", () => {
    const mockUser = buildUserMock();
    const storedToken = buildRefreshTokenMock({
      id: "token-id",
      userId: mockUser.id,
      hashedToken: "hashed_token",
      revoked: false,
      expiresAt: addDays(new Date(), 1),
    });

    const dto = buildRefreshTokenDtoMock({ refreshToken: "old_refresh" });

    let revokeRefreshTokenSpy: MockInstance;
    let generateAuthTokensSpy: MockInstance;

    beforeEach(() => {
      vi.clearAllMocks();

      getOneUserByIDSpy.mockResolvedValue(mockUser);

      revokeRefreshTokenSpy = vi
        .spyOn(AuthService, "revokeRefreshToken")
        .mockResolvedValue(storedToken);

      generateAuthTokensSpy = vi.spyOn(AuthService, "generateAuthTokens").mockResolvedValue({
        accessToken: "new_access",
        refreshToken: "new_refresh",
      });
    });

    it("should successfully refresh tokens", async () => {
      const result = await AuthService.refreshAccessToken({
        dto,
        userIp: "127.0.0.1",
        userAgent: "vi",
      });

      expect(revokeRefreshTokenSpy).toHaveBeenCalledWith({
        dto,
        txInstance: dbSpies.mockTx,
      });

      expect(getOneUserByIDSpy).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
      expect(result).toBeInstanceOf(AuthResponseDTO);
      expect(result.toJSON()).toEqual({
        accessToken: "new_access",
        refreshToken: "new_refresh",
        user: new UserDTO({
          ...mockUser,
        }).toJSON(),
      });
    });

    it("should propagate errors from revokeRefreshToken)", async () => {
      revokeRefreshTokenSpy.mockRejectedValueOnce(new UnauthorizedException());
      await expect(AuthService.refreshAccessToken({ dto })).rejects.toThrow(UnauthorizedException);
    });

    it("should throw NotFoundException if user associated with token is not found", async () => {
      getOneUserByIDSpy.mockResolvedValue(null);
      await expect(AuthService.refreshAccessToken({ dto })).rejects.toThrow(NotFoundException);
    });
  });

  describe("registerDojoAdmin", () => {
    const mockSavedUser = buildUserMock({ id: "new-user-id" });

    const mockDojo = buildDojoMock({
      name: "My Dojo",
      tag: "DOJO",
      tagline: "The best",
      ownerUserId: mockSavedUser.id,
    });

    const userDTO = buildRegisterDojoAdminDTOMock({
      email: "new@user.com",
      username: "newuser",
      password: "password123",
      plan: StripePlans.Monthly,
      dojoName: mockDojo.name,
      dojoTag: mockDojo.tag,
      dojoTagline: mockDojo.tagline,
      fcmToken: "test-fcm-token",
    });

    const mockStripeSubscription = buildStripeSubMock();

    let hashPasswordSpy: MockInstance;
    let createStripeSubscriptionSpy: MockInstance;
    let createDojoSpy: MockInstance;
    let setupBillingSpy: MockInstance;
    let sendWelcomeEmailSpy: MockInstance;
    let generateAuthTokensSpy: MockInstance;
    let sendSignUpNotificationSpy: MockInstance;

    beforeEach(() => {
      // Default success path mocks
      getOneUserByEmailSpy.mockResolvedValue(null);
      getOneUserByUsernameSpy.mockResolvedValue(null);
      getOneDojoByTagSpy.mockResolvedValue(null);

      hashPasswordSpy = vi.spyOn(authUtils, "hashPassword").mockResolvedValue("hashed_password");

      createStripeSubscriptionSpy = vi
        .spyOn(StripeService, "createSubscription")
        .mockResolvedValue(mockStripeSubscription as any);

      setupBillingSpy = vi.spyOn(SubscriptionService, "setupDojoAdminBilling").mockResolvedValue({
        clientSecret: "test_secret",
      });
      saveUserSpy.mockResolvedValue(mockSavedUser);
      createDojoSpy = vi.spyOn(DojosService, "createDojo").mockResolvedValue(mockDojo);
      sendWelcomeEmailSpy = vi
        .spyOn(MailerService, "sendDojoAdminWelcomeEmail")
        .mockResolvedValue();
      sendSignUpNotificationSpy = vi
        .spyOn(NotificationService, "sendDojoAdminSignUpNotification")
        .mockResolvedValue();

      generateAuthTokensSpy = vi.spyOn(AuthService, "generateAuthTokens").mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });
    });

    it("should successfully register a DojoAdmin user", async () => {
      const result = await AuthService.registerDojoAdmin({ dto: userDTO });

      // 1. Check for existing users
      expect(getOneUserByEmailSpy).toHaveBeenCalledWith({
        email: userDTO.email,
        txInstance: dbSpies.mockTx,
      });
      expect(getOneUserByUsernameSpy).toHaveBeenCalledWith({
        username: userDTO.username,
        txInstance: dbSpies.mockTx,
      });
      expect(getOneDojoByTagSpy).toHaveBeenCalledWith(userDTO.dojoTag, dbSpies.mockTx);

      // 2. Stripe calls
      expect(setupBillingSpy).toHaveBeenCalledWith({
        dojo: mockDojo,
        user: mockSavedUser,
        txInstance: dbSpies.mockTx,
      });

      // 3. Save user
      expect(saveUserSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userDTO.email,
          passwordHash: "hashed_password",
          role: Role.DojoAdmin,
        }),
        dbSpies.mockTx,
      );

      expect(createDojoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerUserId: mockSavedUser.id,
          name: userDTO.dojoName,
        }),
        dbSpies.mockTx,
      );

      // 5. Generate tokens
      expect(generateAuthTokensSpy).toHaveBeenCalledWith({
        user: mockSavedUser,
        userAgent: undefined,
        userIp: undefined,
        txInstance: dbSpies.mockTx,
      });

      // 6. Send email
      expect(sendWelcomeEmailSpy).toHaveBeenCalled();

      // Send notification
      expect(sendSignUpNotificationSpy).toHaveBeenCalledWith(mockSavedUser);

      // 7. Final response
      expect(result.toJSON()).toEqual({
        stripeClientSecret: "test_secret",
        accessToken: "access",
        refreshToken: "refresh",
        user: new UserDTO({
          ...mockSavedUser,
        }).toJSON(),
      });
    });

    it("should throw ConflictException if email is already registered", async () => {
      getOneUserByEmailSpy.mockResolvedValue(buildUserMock());
      await expect(AuthService.registerDojoAdmin({ dto: userDTO })).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw ConflictException if username is already taken", async () => {
      getOneUserByUsernameSpy.mockResolvedValue(buildUserMock());
      await expect(AuthService.registerDojoAdmin({ dto: userDTO })).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw ConflictException if dojo tag is already taken", async () => {
      getOneDojoByTagSpy.mockResolvedValue(buildDojoMock());
      await expect(AuthService.registerDojoAdmin({ dto: userDTO })).rejects.toThrow(
        ConflictException,
      );
    });

    it("should consume and log mailer errors without failing the registration", async () => {
      const mailError = new Error("SMTP server down");
      sendWelcomeEmailSpy.mockRejectedValue(mailError);

      await expect(AuthService.registerDojoAdmin({ dto: userDTO })).resolves.toBeDefined();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("An Error occurred while trying to send email"),
        mailError,
      );
    });

    it("should use a provided transaction instance", async () => {
      await AuthService.registerDojoAdmin({ dto: userDTO }, dbSpies.mockTx);
      expect(dbService.runInTransaction).not.toHaveBeenCalled();
      expect(getOneUserByEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({ txInstance: dbSpies.mockTx }),
      );
    });
  });

  describe("logoutUser", () => {
    const dto = buildRefreshTokenDtoMock({ refreshToken: "refresh_token" });
    let revokeRefreshTokenSpy: MockInstance;

    beforeEach(() => {
      revokeRefreshTokenSpy = vi
        .spyOn(AuthService, "revokeRefreshToken")
        .mockResolvedValue({} as any);
    });

    it("should successfully logout user by revoking token", async () => {
      await AuthService.logoutUser({ dto });
      expect(revokeRefreshTokenSpy).toHaveBeenCalledWith({
        dto,
        txInstance: expect.anything(),
      });
    });

    it("should propagate errors from revokeRefreshToken", async () => {
      revokeRefreshTokenSpy.mockRejectedValue(new UnauthorizedException());
      await expect(AuthService.logoutUser({ dto })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("isUsernameAvailable", () => {
    it("should return false if username is taken", async () => {
      getOneUserByUsernameSpy.mockResolvedValue(buildUserMock());

      const result = await AuthService.isUsernameAvailable({
        username: "taken_user",
      });

      expect(result).toBe(false);
      expect(getOneUserByUsernameSpy).toHaveBeenCalledWith({
        username: "taken_user",
        txInstance: expect.anything(),
      });
    });

    it("should return true if username is available", async () => {
      getOneUserByUsernameSpy.mockResolvedValue(null);

      const result = await AuthService.isUsernameAvailable({
        username: "new_user",
      });

      expect(result).toBe(true);
    });

    it("should use provided transaction instance", async () => {
      getOneUserByUsernameSpy.mockResolvedValue(null);

      await AuthService.isUsernameAvailable({
        username: "test",
        txInstance: dbSpies.mockTx,
      });

      expect(dbService.runInTransaction).not.toHaveBeenCalled();
      expect(getOneUserByUsernameSpy).toHaveBeenCalledWith({
        username: "test",
        txInstance: dbSpies.mockTx,
      });
    });
  });

  describe("isDojoTagAvailable", () => {
    it("should return false if username is taken", async () => {
      getOneDojoByTagSpy.mockResolvedValue(buildDojoMock());

      const result = await AuthService.isDojoTagAvailable({
        tag: "taken_tag",
      });

      expect(result).toBe(false);
      expect(getOneDojoByTagSpy).toHaveBeenCalledWith("taken_tag", expect.anything());
    });

    it("should return true if username is available", async () => {
      getOneDojoByTagSpy.mockResolvedValue(null);

      const result = await AuthService.isDojoTagAvailable({
        tag: "new_tag",
      });

      expect(result).toBe(true);
    });
  });

  describe("firebaseSignIn", () => {
    const dto = {
      idToken: "firebase-token",
    };

    const firebaseUser = buildFirebaseUserMock({
      uid: "firebase-uid",
      email: "user@example.com",
      emailVerified: true,
      name: "John Doe",
      picture: "avatar.png",
      provider: SupportedOAuthProviders.Google,
    });

    const user = buildUserMock({
      id: "user-id",
      email: "user@example.com",
    });

    let runInTxSpy: MockInstance;
    let verifyTokenSpy: MockInstance;
    let findByProviderSpy: MockInstance;
    let createOAuthAcctSpy: MockInstance;
    let updateSpy: MockInstance;
    let generateTokenSpy: MockInstance;

    beforeEach(() => {
      vi.clearAllMocks();

      runInTxSpy = vi.spyOn(dbService, "runInTransaction").mockImplementation(async (cb) => cb(dbSpies.mockTx));

      verifyTokenSpy = vi
        .spyOn(FirebaseService, "verifyFirebaseToken")
        .mockResolvedValue(firebaseUser);

      findByProviderSpy = vi
        .spyOn(UserOAuthAccountsRepository, "findByProviderAndProviderUserId")
        .mockResolvedValue(null);

      createOAuthAcctSpy = vi
        .spyOn(UserOAuthAccountsRepository, "createOAuthAcct")
        .mockResolvedValue(undefined);

      updateSpy = vi
        .spyOn(UserOAuthAccountsRepository, "updateOAuthAcct")
        .mockResolvedValue(undefined);

      generateTokenSpy = vi.spyOn(AuthService, "generateAuthTokens").mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      getOneUserByEmailSpy.mockResolvedValue(user);
    });

    describe("transaction handling", () => {
      it("should run inside dbService.runInTransaction when txInstance is not provided", async () => {
        const result = await AuthService.firebaseSignIn({ dto });

        expect(runInTxSpy).toHaveBeenCalled();
        expect(result).toBeInstanceOf(AuthResponseDTO);
      });
    });

    it("should throw UnauthorizedException if Firebase email is not verified", async () => {
      verifyTokenSpy.mockResolvedValue({
        ...firebaseUser,
        emailVerified: false,
      });

      await expect(AuthService.firebaseSignIn({ dto, txInstance: dbSpies.mockTx })).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(AuthService.firebaseSignIn({ dto, txInstance: dbSpies.mockTx })).rejects.toThrow(
        "Social Auth Email not verified",
      );
    });

    it("should throw NotFoundException if user does not exist", async () => {
      getOneUserByEmailSpy.mockResolvedValue(null);

      await expect(AuthService.firebaseSignIn({ dto, txInstance: dbSpies.mockTx })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should create OAuth account if none exists", async () => {
      findByProviderSpy.mockResolvedValue(null);

      const result = await AuthService.firebaseSignIn({
        dto,
        txInstance: dbSpies.mockTx,
      });

      expect(createOAuthAcctSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          dto: expect.objectContaining({
            userId: user.id,
            provider: firebaseUser.provider,
            providerUserId: firebaseUser.uid,
          }),
        }),
      );

      expect(result).toBeInstanceOf(AuthResponseDTO);
    });

    it("should update OAuth account if it already exists", async () => {
      findByProviderSpy.mockResolvedValue(buildOAuthAcctMock({ id: "oauth-id" }));

      const result = await AuthService.firebaseSignIn({
        dto,
        txInstance: dbSpies.mockTx,
      });

      expect(updateSpy).toHaveBeenCalled();
      expect(result.userDto).toBeInstanceOf(UserDTO);
    });

    it("should pass userIp and userAgent to generateAuthTokens", async () => {
      findByProviderSpy.mockResolvedValue(null);

      await AuthService.firebaseSignIn({
        dto,
        userIp: "127.0.0.1",
        userAgent: "vi",
        txInstance: dbSpies.mockTx,
      });

      expect(generateTokenSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          userIp: "127.0.0.1",
          userAgent: "vi",
        }),
      );
    });
  });

  describe("requestPasswordReset", () => {
    const dto = { email: "test@example.com" };
    const user = buildUserMock({ email: dto.email });

    let createOTPSpy: MockInstance;
    let sendPasswordResetMailSpy: MockInstance;

    beforeEach(() => {
      createOTPSpy = vi.spyOn(AuthService, "createOTP").mockResolvedValue({ otp: "123456", otpId: "otp-id" });
      sendPasswordResetMailSpy = vi
        .spyOn(MailerService, "sendPasswordResetMail")
        .mockResolvedValue(undefined);
    });

    afterEach(() => {
      createOTPSpy.mockRestore();
    });

    it("should initiate password reset for existing user", async () => {
      getOneUserByEmailSpy.mockResolvedValue(user);

      await AuthService.requestPasswordReset({ dto });

      expect(getOneUserByEmailSpy).toHaveBeenCalledWith({
        email: dto.email,
        txInstance: expect.anything(),
      });
      expect(createOTPSpy).toHaveBeenCalledWith(user, OtpType.PasswordReset, expect.anything());
      expect(sendPasswordResetMailSpy).toHaveBeenCalledWith({
        dest: user.email,
        name: user.firstName,
        otp: "123456",
      });
    });

    it("should throw NotFoundException if user is not found", async () => {
      getOneUserByEmailSpy.mockResolvedValue(null);

      await expect(AuthService.requestPasswordReset({ dto })).rejects.toThrow(NotFoundException);

      expect(getOneUserByEmailSpy).toHaveBeenCalled();
      expect(createOTPSpy).not.toHaveBeenCalled();
      expect(sendPasswordResetMailSpy).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    const dto = { resetToken: "valid_token", newPassword: "new_password" };
    const decodedToken = { userId: "user-1", scope: "password_reset" };

    let verifyTokenSpy: MockInstance;
    let hashPasswordSpy: MockInstance;
    let updateUserSpy: MockInstance;

    beforeEach(() => {
      verifyTokenSpy = vi
        .spyOn(authUtils, "verifyPasswordResetToken")
        .mockReturnValue(decodedToken);
      hashPasswordSpy = vi
        .spyOn(authUtils, "hashPassword")
        .mockResolvedValue("new_hashed_password");
      updateUserSpy = vi.spyOn(UsersService, "updateUser").mockResolvedValue(undefined);
    });

    it("should reset password and revoke refresh tokens", async () => {
      await AuthService.resetPassword({ dto });

      expect(verifyTokenSpy).toHaveBeenCalledWith(dto.resetToken);
      expect(hashPasswordSpy).toHaveBeenCalledWith(dto.newPassword);
      expect(updateUserSpy).toHaveBeenCalledWith({
        txInstance: expect.anything(),
        userId: decodedToken.userId,
        update: { passwordHash: "new_hashed_password" },
      });

      expect(dbSpies.mockDelete).toHaveBeenCalledWith(refreshTokens);
      expect(dbSpies.mockWhere).toHaveBeenCalledWith(eq(refreshTokens.userId, decodedToken.userId));
      expect(OTPRepository.revokeUserPendingOTPs).toHaveBeenCalledWith({
        tx: expect.anything(),
        userId: decodedToken.userId,
      });
    });

    it("should throw if token verification fails", async () => {
      verifyTokenSpy.mockImplementation(() => {
        throw new BadRequestException("Invalid token");
      });

      await expect(AuthService.resetPassword({ dto })).rejects.toThrow(BadRequestException);
      expect(updateUserSpy).not.toHaveBeenCalled();
    });
  });

  describe("verifyPasswordResetOtp", () => {
    const dto = { email: "test@example.com", otp: "123456" };
    const user = buildUserMock({ email: dto.email });
    const otpRecord = buildIOtpMock({
      id: "otp-id",
      userId: user.id,
      hashedOTP: "hashed_otp",
      attempts: 0,
      expiresAt: addDays(new Date(), 1),
    });

    let findOneOTPSpy: MockInstance;
    let incrementAttemptsSpy: MockInstance;
    let updateByIdSpy: MockInstance;
    let generateResetTokenSpy: MockInstance;
    let hashTokenSpy: MockInstance;

    beforeEach(() => {
      vi.useFakeTimers();
      findOneOTPSpy = vi.spyOn(OTPRepository, "findOne");
      incrementAttemptsSpy = vi
        .spyOn(OTPRepository, "incrementActiveOTPsAttempts")
        .mockResolvedValue(undefined);
      updateByIdSpy = vi.spyOn(OTPRepository, "updateById").mockResolvedValue(undefined);
      generateResetTokenSpy = vi
        .spyOn(authUtils, "generatePasswordResetToken")
        .mockReturnValue("reset_token");
      hashTokenSpy = vi.spyOn(authUtils, "hashToken").mockReturnValue("hashed_otp");
      vi.spyOn(AuthService, "verifyOtp").mockResolvedValue(undefined);
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.spyOn(AuthService, "verifyOtp").mockRestore();
    });

    it("should verify OTP successfully and return reset token", async () => {
      getOneUserByEmailSpy.mockResolvedValue(user);

      const result = await AuthService.verifyPasswordResetOtp({ dto });

      expect(getOneUserByEmailSpy).toHaveBeenCalledWith({
        email: dto.email,
        txInstance: expect.anything(),
      });
      expect(AuthService.verifyOtp).toHaveBeenCalledWith({
        otp: dto.otp,
        user,
        type: OtpType.PasswordReset,
        txInstance: expect.anything(),
      });
      expect(generateResetTokenSpy).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({ resetToken: "reset_token" });
    });

    it("should throw BadRequestException if user not found", async () => {
      getOneUserByEmailSpy.mockResolvedValue(null);
      await expect(AuthService.verifyPasswordResetOtp({ dto })).rejects.toThrow(BadRequestException);
    }, 10000);

    it("should throw TooManyRequestsException if verifyOtp throws it", async () => {
      getOneUserByEmailSpy.mockResolvedValue(user);
      vi.spyOn(AuthService, "verifyOtp").mockRejectedValue(new TooManyRequestsException("Too many attempts"));

      await expect(AuthService.verifyPasswordResetOtp({ dto })).rejects.toThrow(TooManyRequestsException);
    });
  });

  describe("verifyOtp", () => {
    const user = buildUserMock({ id: "user-123" });
    const dto = { email: user.email, otp: "123456" };
    const type = OtpType.PasswordReset;
    const otpRecord = buildIOtpMock({
      id: "otp-id",
      userId: user.id,
      hashedOTP: "hashed_otp",
      attempts: 0,
      expiresAt: addDays(new Date(), 1),
    });

    let findOneActiveOTPSpy: MockInstance;
    let incrementAttemptsSpy: MockInstance;
    let updateByIdSpy: MockInstance;

    beforeEach(() => {
      findOneActiveOTPSpy = vi.spyOn(OTPRepository, "findOneActiveOTP");
      incrementAttemptsSpy = vi
        .spyOn(OTPRepository, "incrementActiveOTPsAttempts")
        .mockResolvedValue(undefined);
      updateByIdSpy = vi.spyOn(OTPRepository, "updateById").mockResolvedValue(undefined);
    });

    it("should successfully burn OTP if valid", async () => {
      findOneActiveOTPSpy.mockResolvedValue(otpRecord);

      await AuthService.verifyOtp({ otp: dto.otp, type, user });

      expect(findOneActiveOTPSpy).toHaveBeenCalled();
      expect(updateByIdSpy).toHaveBeenCalledWith({
        tx: expect.anything(),
        otpID: otpRecord.id,
        update: { status: OtpStatus.Used },
      });
    });

    it("should increment attempts and throw if OTP not found", async () => {
      findOneActiveOTPSpy.mockResolvedValue(null);

      await expect(AuthService.verifyOtp({ otp: dto.otp, type, user })).rejects.toThrow(BadRequestException);

      expect(incrementAttemptsSpy).toHaveBeenCalledWith({
        tx: expect.anything(),
        userId: user.id,
      });
    });

    it("should burn OTP and throw if max attempts reached", async () => {
      const exhaustedOtp = { ...otpRecord, attempts: AppConstants.MAX_OTP_VERIFICATION_ATTEMPTS };
      findOneActiveOTPSpy.mockResolvedValue(exhaustedOtp);

      await expect(AuthService.verifyOtp({ otp: dto.otp, type, user })).rejects.toThrow(TooManyRequestsException);

      expect(updateByIdSpy).toHaveBeenCalledWith({
        tx: expect.anything(),
        otpID: exhaustedOtp.id,
        update: {
          status: OtpStatus.Revoked,
          attempts: exhaustedOtp.attempts + 1,
        },
      });
    });
  });

  describe("createOTP", () => {
    const user = buildUserMock({ id: "user-123" });
    const type = OtpType.EmailVerification;

    let deleteExistingOtpsSpy: MockInstance;
    let createOTPSpy: MockInstance;
    let generateOTPSpy: MockInstance;
    let hashTokenSpy: MockInstance;

    beforeEach(() => {
      deleteExistingOtpsSpy = vi.spyOn(OTPRepository, "deleteByUserIdAndType").mockResolvedValue(undefined);
      createOTPSpy = vi.spyOn(OTPRepository, "createOTP").mockResolvedValue("otp-id");
      generateOTPSpy = vi.spyOn(authUtils, "generateOTP").mockReturnValue("123456");
      hashTokenSpy = vi.spyOn(authUtils, "hashToken").mockReturnValue("hashed_otp");
    });

    it("should generate, hash, and save OTP after invalidating old ones", async () => {
      const result = await AuthService.createOTP(user, type, dbSpies.mockTx);

      expect(deleteExistingOtpsSpy).toHaveBeenCalledWith({
        tx: dbSpies.mockTx,
        userId: user.id,
        type
      });
      expect(generateOTPSpy).toHaveBeenCalled();
      expect(hashTokenSpy).toHaveBeenCalledWith("123456");
      expect(createOTPSpy).toHaveBeenCalledWith({
        tx: dbSpies.mockTx,
        dto: expect.objectContaining({
          userId: user.id,
          type,
          hashedOTP: "hashed_otp",
          attempts: 0,
        }),
      });
      expect(result).toEqual({ otp: "123456", otpId: "otp-id" });
    });
  });

  describe("requestEmailVerification", () => {
    const user = buildUserMock({ id: "user-123", emailVerified: false });

    let createOTPSpy: MockInstance;
    let sendEmailVerificationMailSpy: MockInstance;

    beforeEach(() => {
      createOTPSpy = vi.spyOn(AuthService, "createOTP").mockResolvedValue({ otp: "123456", otpId: "otp-id" });
      sendEmailVerificationMailSpy = vi
        .spyOn(MailerService, "sendEmailVerificationMail")
        .mockResolvedValue(undefined);
    });

    afterEach(() => {
      createOTPSpy.mockRestore();
    });

    it("should initiate email verification for unverified user", async () => {
      await AuthService.requestEmailVerification({ user });

      expect(createOTPSpy).toHaveBeenCalledWith(user, OtpType.EmailVerification, expect.anything());
      expect(sendEmailVerificationMailSpy).toHaveBeenCalledWith({
        dest: user.email,
        name: user.firstName,
        otp: "123456",
      });
    });

    it("should throw BadRequestException if email is already verified", async () => {
      const verifiedUser = { ...user, emailVerified: true };
      await expect(AuthService.requestEmailVerification({ user: verifiedUser })).rejects.toThrow(BadRequestException);
      expect(createOTPSpy).not.toHaveBeenCalled();
    });
  });

  describe("verifyEmailVerification", () => {
    const user = buildUserMock({ id: "user-123", email: "test@test.com", firstName: "Test" });
    const dto = { otp: "123456" };
    const otpRecord = buildIOtpMock({ userId: user.id, type: OtpType.EmailVerification });

    let verifyOtpSpy: MockInstance;
    let updateUserSpy: MockInstance;
    let sendEmailVerifiedNotificationSpy: MockInstance;

    beforeEach(() => {
      verifyOtpSpy = vi.spyOn(AuthService, "verifyOtp").mockResolvedValue(undefined);
      updateUserSpy = vi.spyOn(UsersService, "updateUser").mockResolvedValue(undefined);
      sendEmailVerifiedNotificationSpy = vi
        .spyOn(MailerService, "sendEmailVerifiedNotification")
        .mockResolvedValue(undefined);
    });

    afterEach(() => {
      verifyOtpSpy.mockRestore();
    });

    it("should verify OTP, update user, and send notification", async () => {
      await AuthService.verifyEmailVerification({ dto, user });

      expect(verifyOtpSpy).toHaveBeenCalledWith({
        otp: dto.otp,
        user,
        type: OtpType.EmailVerification,
        txInstance: expect.anything(),
      });
      expect(updateUserSpy).toHaveBeenCalledWith({
        txInstance: expect.anything(),
        userId: user.id,
        update: { emailVerified: true },
      });
      expect(sendEmailVerifiedNotificationSpy).toHaveBeenCalledWith(user.email, user.firstName);
    });
  });

  describe("registerParent", () => {
    const parentDto = buildRegisterParentDTOMock({
      email: "parent@test.com",
      username: "parentuser",
      password: "Password123!",
      firstName: "Parent",
      lastName: "User",
      fcmToken: "token",
    });

    // Define mockSavedUser locally
    const parentUser = buildUserMock({
      ...parentDto,
      id: "user-id",
      role: Role.Parent,
      passwordHash: "hashed",
    });

    const parent = buildParentMock({
      userId: parentUser.id,
    });

    let sendParentWelcomeEmailSpy: MockInstance;
    let sendParentSignUpNotificationSpy: MockInstance;
    let createParentSpy: MockInstance;

    beforeEach(() => {
      sendParentWelcomeEmailSpy = vi
        .spyOn(MailerService, "sendParentWelcomeEmail")
        .mockResolvedValue();

      sendParentSignUpNotificationSpy = vi
        .spyOn(NotificationService, "sendParentSignUpNotification")
        .mockResolvedValue();

      createParentSpy = vi.spyOn(ParentRepository, "create").mockResolvedValue(parent.id);

      // Reset specific spies
      getOneUserByEmailSpy.mockResolvedValue(null);
      getOneUserByUsernameSpy.mockResolvedValue(null);
      saveUserSpy.mockResolvedValue({ ...parentUser, role: Role.Parent });
    });

    it("should successfully register a parent", async () => {
      const result = await AuthService.registerParent({ dto: parentDto });

      expect(getOneUserByEmailSpy).toHaveBeenCalledWith({
        email: parentDto.email,
        txInstance: dbSpies.mockTx,
      });

      // Username check logic
      expect(getOneUserByUsernameSpy).toHaveBeenCalledWith({
        username: parentDto.username,
        txInstance: dbSpies.mockTx,
      });

      expect(saveUserSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email: parentDto.email,
          role: Role.Parent,
          username: parentDto.username,
        }),
        dbSpies.mockTx,
      );

      expect(sendParentWelcomeEmailSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
      expect(sendParentSignUpNotificationSpy).toHaveBeenCalled();

      expect(result).toBeInstanceOf(AuthResponseDTO);
      expect(result.userDto.role).toBe(Role.Parent);
    });

    it("should throw ConflictException if email exists", async () => {
      getOneUserByEmailSpy.mockResolvedValue(parentUser);

      await expect(AuthService.registerParent({ dto: parentDto })).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw ConflictException if username is taken", async () => {
      getOneUserByUsernameSpy.mockResolvedValue(parentUser);

      await expect(AuthService.registerParent({ dto: parentDto })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("changePassword", () => {
    const userId = "user-123";
    const dto = buildChangePasswordDTOMock({
      oldPassword: "oldPassword123",
      newPassword: "newPassword123!",
    });
    
    const mockUser = buildUserMock({
      id: userId,
      passwordHash: "oldHashedPassword",
      email: "test@example.com",
      firstName: "Test",
    });

    let verifyPasswordSpy: MockInstance;
    let hashPasswordSpy: MockInstance;
    let updateUserSpy: MockInstance;
    let deleteByUserIdSpy: MockInstance;
    let sendNotificationSpy: MockInstance;

    beforeEach(() => {
      verifyPasswordSpy = vi.spyOn(authUtils, "verifyPassword");
      hashPasswordSpy = vi.spyOn(authUtils, "hashPassword").mockResolvedValue("newHashedPassword");
      updateUserSpy = vi.spyOn(UsersService, "updateUser").mockResolvedValue();
      deleteByUserIdSpy = vi.spyOn(RefreshTokenRepository, "deleteByUserId").mockResolvedValue();
      sendNotificationSpy = vi
        .spyOn(MailerService, "sendPasswordChangedNotification")
        .mockResolvedValue();

      getOneUserByIDSpy.mockResolvedValue(mockUser);
    });

    it("should successfully change password", async () => {
      verifyPasswordSpy.mockResolvedValue(true);

      await AuthService.changePassword({ userId, dto });

      expect(getOneUserByIDSpy).toHaveBeenCalledWith({
        userId,
        txInstance: dbSpies.mockTx,
        withPassword: true,
      });
      expect(verifyPasswordSpy).toHaveBeenCalledWith("oldHashedPassword", dto.oldPassword);
      expect(hashPasswordSpy).toHaveBeenCalledWith(dto.newPassword);
      expect(updateUserSpy).toHaveBeenCalledWith({
        userId,
        update: { passwordHash: "newHashedPassword" },
        txInstance: dbSpies.mockTx,
      });
      expect(deleteByUserIdSpy).toHaveBeenCalledWith(userId, dbSpies.mockTx);
      expect(OTPRepository.revokeUserPendingOTPs).toHaveBeenCalledWith({
        tx: dbSpies.mockTx,
        userId,
      });
      expect(sendNotificationSpy).toHaveBeenCalledWith(mockUser.email, mockUser.firstName);
    });

    it("should throw NotFoundException if user is not found", async () => {
      getOneUserByIDSpy.mockResolvedValue(null);

      await expect(AuthService.changePassword({ userId, dto })).rejects.toThrow(NotFoundException);
    });

    it("should throw UnauthorizedException if old password is incorrect", async () => {
      verifyPasswordSpy.mockResolvedValue(false);

      await expect(AuthService.changePassword({ userId, dto })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("requestEmailUpdate", () => {
    const user = buildUserMock({ id: "user-123", email: "old@test.com", firstName: "Test" });
    const dto = { newEmail: "new@test.com", password: "password123" };

    let getOneUserByIDSpy: MockInstance;
    let verifyPasswordSpy: MockInstance;
    let createOTPSpy: MockInstance;
    let revokePendingByUserIdSpy: MockInstance;
    let emailUpdateCreateSpy: MockInstance;
    let sendEmailUpdateOtpSpy: MockInstance;
    let sendEmailUpdateNotificationSpy: MockInstance;

    beforeEach(() => {
      getOneUserByIDSpy = vi.spyOn(UsersService, "getOneUserByID").mockResolvedValue({
        ...user,
        passwordHash: "hashed_password",
      });
      getOneUserByEmailSpy.mockResolvedValue(null);
      verifyPasswordSpy = vi.spyOn(authUtils, "verifyPassword").mockResolvedValue(true);
      createOTPSpy = vi.spyOn(AuthService, "createOTP").mockResolvedValue({ otp: "123456", otpId: "otp-id" });
      revokePendingByUserIdSpy = vi
        .spyOn(EmailUpdateRequestRepository, "revokePendingByUserId")
        .mockResolvedValue(undefined);
      emailUpdateCreateSpy = vi
        .spyOn(EmailUpdateRequestRepository, "create")
        .mockResolvedValue("email-update-id");
      sendEmailUpdateOtpSpy = vi.spyOn(MailerService, "sendEmailUpdateOtp").mockResolvedValue(undefined);
      sendEmailUpdateNotificationSpy = vi
        .spyOn(MailerService, "sendEmailUpdateNotification")
        .mockResolvedValue(undefined);
    });

    afterEach(() => {
      createOTPSpy.mockRestore();
    });

    it("should successfully request email update", async () => {
      await AuthService.requestEmailUpdate({ dto, user });

      expect(verifyPasswordSpy).toHaveBeenCalledWith("hashed_password", dto.password);
      expect(revokePendingByUserIdSpy).toHaveBeenCalledWith({
        userId: user.id,
        tx: expect.anything(),
      });
      expect(createOTPSpy).toHaveBeenCalledWith(user, OtpType.EmailUpdate, expect.anything());
      expect(emailUpdateCreateSpy).toHaveBeenCalledWith({
        dto: expect.objectContaining({
          userId: user.id,
          oldEmail: user.email,
          newEmail: dto.newEmail,
          otpId: "otp-id",
          status: EmailUpdateStatus.Pending,
        }),
        tx: expect.anything(),
      });
      expect(sendEmailUpdateOtpSpy).toHaveBeenCalledWith({
        dest: dto.newEmail,
        name: user.firstName,
        otp: "123456",
      });
      expect(sendEmailUpdateNotificationSpy).toHaveBeenCalledWith({
        dest: user.email,
        name: user.firstName,
        newEmail: dto.newEmail,
      });
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      verifyPasswordSpy.mockResolvedValue(false);

      await expect(AuthService.requestEmailUpdate({ dto, user })).rejects.toThrow(UnauthorizedException);
      expect(createOTPSpy).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException if new email is same as current", async () => {
      const sameEmailDto = { newEmail: user.email, password: "password123" };

      await expect(AuthService.requestEmailUpdate({ dto: sameEmailDto, user })).rejects.toThrow(BadRequestException);
      expect(createOTPSpy).not.toHaveBeenCalled();
    });

    it("should throw ConflictException if new email is already registered", async () => {
      getOneUserByEmailSpy.mockResolvedValue(buildUserMock({ email: dto.newEmail }));

      await expect(AuthService.requestEmailUpdate({ dto, user })).rejects.toThrow(ConflictException);
      expect(createOTPSpy).not.toHaveBeenCalled();
    });
  });

  describe("verifyEmailUpdate", () => {
    const user = buildUserMock({ id: "user-123", email: "old@test.com", firstName: "Test" });
    const dto = { otp: "123456" };
    const emailUpdateRequest = buildEmailUpdateRequestMock({
      id: "email-update-id",
      userId: user.id,
      oldEmail: user.email,
      newEmail: "new@test.com",
      status: EmailUpdateStatus.Pending,
      otpId: "otp-id",
    });

    const otpRecord = buildIOtpMock({ userId: user.id, type: OtpType.EmailUpdate });

    let findPendingByUserIdSpy: MockInstance;
    let verifyOtpSpy: MockInstance;
    let updateUserSpy: MockInstance;
    let updateStatusSpy: MockInstance;
    let sendEmailUpdateConfirmationSpy: MockInstance;

    beforeEach(() => {
      findPendingByUserIdSpy = vi
        .spyOn(EmailUpdateRequestRepository, "findLatestPendingByUserId")
        .mockResolvedValue(emailUpdateRequest);
      verifyOtpSpy = vi.spyOn(AuthService, "verifyOtp").mockResolvedValue(undefined);
      updateUserSpy = vi.spyOn(UsersService, "updateUser").mockResolvedValue(undefined);
      updateStatusSpy = vi
        .spyOn(EmailUpdateRequestRepository, "updateStatus")
        .mockResolvedValue(undefined);
      sendEmailUpdateConfirmationSpy = vi
        .spyOn(MailerService, "sendEmailUpdateConfirmation")
        .mockResolvedValue(undefined);
    });

    afterEach(() => {
      verifyOtpSpy.mockRestore();
    });

    it("should successfully verify email update and change email", async () => {
      await AuthService.verifyEmailUpdate({ dto, user });

      expect(findPendingByUserIdSpy).toHaveBeenCalledWith({
        userId: user.id,
        tx: expect.anything(),
      });
      expect(verifyOtpSpy).toHaveBeenCalledWith({
        otp: dto.otp,
        user,
        type: OtpType.EmailUpdate,
        onRevoke: expect.any(Function),
        txInstance: expect.anything(),
      });
      expect(updateUserSpy).toHaveBeenCalledWith({
        txInstance: expect.anything(),
        userId: user.id,
        update: {
          email: emailUpdateRequest.newEmail,
          emailVerified: true,
        },
      });
      expect(updateStatusSpy).toHaveBeenCalledWith({
        id: emailUpdateRequest.id,
        status: EmailUpdateStatus.Verified,
        tx: expect.anything(),
      });
      expect(OTPRepository.revokeUserPendingOTPs).toHaveBeenCalledWith({
        tx: expect.anything(),
        userId: user.id,
      });
      expect(sendEmailUpdateConfirmationSpy).toHaveBeenCalledWith({
        dest: emailUpdateRequest.newEmail,
        name: user.firstName,
        isNewEmail: true,
      });
      expect(sendEmailUpdateConfirmationSpy).toHaveBeenCalledWith({
        dest: user.email,
        name: user.firstName,
        isNewEmail: false,
      });
    });

    it("should throw BadRequestException if no pending email update request found", async () => {
      findPendingByUserIdSpy.mockResolvedValue(null);

      await expect(AuthService.verifyEmailUpdate({ dto, user })).rejects.toThrow(BadRequestException);
      expect(verifyOtpSpy).not.toHaveBeenCalled();
    });
  });
});

const impoev = `This test suite provides a solid foundation for your authentication service. It uses Jest's mocking capabilities to isolate the service and test its logic in a controlled environment, ensuring each part works as expected. <!--
[PROMPT_SUGGESTION]Can you write integration tests for the user registration endpoint ('/auth/register')?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Refactor the test setup to reduce boilerplate code across the different test files.[/PROMPT_SUGGESTION]
`;
