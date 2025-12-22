import { jest, describe, it, expect, afterEach } from "@jest/globals";
import * as authService from "./auth.service.js";
import * as dbService from "../db/index.js";
import * as userService from "./users.service.js";
import * as stripeService from "./stripe.service.js";
import * as dojosService from "./dojos.service.js";
import * as mailerService from "./mailer.service.js";
import * as authUtils from "../utils/auth.utils.js";
import * as firebaseService from "./firebase.service.js";
import {
  createDrizzleDbSpies,
  DbServiceSpies,
} from "../tests/spies/drizzle-db.spies.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import {
  buildStripeCustMock,
  buildStripeSubMock,
} from "../tests/factories/stripe.factory.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  TooManyRequestsException,
} from "../core/errors/index.js";
import {
  Role,
  StripePlans,
  SupportedOAuthProviders,
} from "../constants/enums.js";
import { addDays, subDays } from "date-fns";
import { refreshTokens } from "../db/schema.js";
import { eq } from "drizzle-orm";
import {
  buildLoginDTOMock,
  buildOAuthAcctMock,
  buildRefreshTokenDtoMock,
  buildRefreshTokenMock,
  buildRegisterUserDTOMock as buildRegisterDojoAdminDTOMock,
} from "../tests/factories/auth.factory.js";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";
import { UserDTO } from "../dtos/user.dtos.js";
import { buildFirebaseUserMock } from "../tests/factories/firebase.factory.js";
import { UserOAuthAccountsRepository } from "../repositories/oauth-providers.repository.js";
import { PasswordResetOTPRepository } from "../repositories/password-reset-otps.repository.js";
import AppConstants from "../constants/AppConstants.js";
import { AuthResponseDTO } from "../dtos/auth.dtos.js";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository.js";
import { SubscriptionService } from "./subscription.service.js";

describe("Auth Service", () => {
  let dbSpies: DbServiceSpies;
  let logSpy: ReturnType<typeof jest.spyOn>;

  let getOneUserByEmailSpy: ReturnType<typeof jest.spyOn>;
  let getOneUserByUsernameSpy: ReturnType<typeof jest.spyOn>;
  let getOneDojoByTagSpy: ReturnType<typeof jest.spyOn>;
  let saveUserSpy: ReturnType<typeof jest.spyOn>;
  let getOneUserByIDSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    dbSpies = createDrizzleDbSpies();

    getOneUserByEmailSpy = jest.spyOn(userService, "getOneUserByEmail");
    getOneUserByIDSpy = jest.spyOn(userService, "getOneUserByID");
    getOneUserByUsernameSpy = jest.spyOn(userService, "getOneUserByUserName");
    getOneDojoByTagSpy = jest.spyOn(dojosService, "getOneDojoByTag");
    saveUserSpy = jest.spyOn(userService, "saveUser");

    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateAuthTokens", () => {
    const mockUser = buildUserMock({ role: Role.DojoAdmin });

    let generateAccessTokenSpy: ReturnType<typeof jest.spyOn>;
    let generateRefreshTokenSpy: ReturnType<typeof jest.spyOn>;
    let hashTokenSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      generateAccessTokenSpy = jest
        .spyOn(authUtils, "generateAccessToken")
        .mockReturnValue("access_token");
      generateRefreshTokenSpy = jest
        .spyOn(authUtils, "generateRefreshToken")
        .mockReturnValue("refresh_token");
      hashTokenSpy = jest
        .spyOn(authUtils, "hashToken")
        .mockReturnValue("hashed_refresh_token");
    });

    it("should generate and save tokens, returning the raw tokens", async () => {
      const result = await authService.generateAuthTokens({ user: mockUser });

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
        })
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

    let verifyPasswordSpy: ReturnType<typeof jest.spyOn>;
    let updateUserSpy: ReturnType<typeof jest.spyOn>;
    let generateAuthTokensSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      verifyPasswordSpy = jest.spyOn(authUtils, "verifyPassword");
      updateUserSpy = jest.spyOn(userService, "updateUser").mockResolvedValue();
      generateAuthTokensSpy = jest
        .spyOn(authService, "generateAuthTokens")
        .mockResolvedValue({
          accessToken: "access",
          refreshToken: "refresh",
        });
    });

    it("should successfully log in a user and return tokens and user data", async () => {
      getOneUserByEmailSpy.mockResolvedValue(mockUser);
      verifyPasswordSpy.mockResolvedValue(true);

      const result = await authService.loginUser({ dto: loginDTO });

      expect(getOneUserByEmailSpy).toHaveBeenCalledWith({
        email: loginDTO.email,
        txInstance: dbSpies.mockTx,
        withPassword: true,
      });
      expect(verifyPasswordSpy).toHaveBeenCalledWith(
        "hashed_password",
        "password123"
      );
      expect(updateUserSpy).toHaveBeenCalledWith({
        userId: mockUser.id,
        update: { fcmToken: loginDTO.fcmToken },
        txInstance: dbSpies.mockTx,
      });
      expect(generateAuthTokensSpy).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: "access",
        refreshToken: "refresh",
        user: new UserDTO(mockUser).toJSON(),
      });
    });

    it("should not update user if fcmToken is not provided", async () => {
      const noFcmTokenDTO = { ...loginDTO, fcmToken: undefined };
      await authService.loginUser({ dto: noFcmTokenDTO });
      expect(updateUserSpy).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if user is not found", async () => {
      getOneUserByEmailSpy.mockResolvedValue(null);
      await expect(authService.loginUser({ dto: loginDTO })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      getOneUserByEmailSpy.mockResolvedValue(mockUser);
      verifyPasswordSpy.mockResolvedValue(false);
      await expect(authService.loginUser({ dto: loginDTO })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException if password is empty or undefined", async () => {
      getOneUserByEmailSpy.mockResolvedValue(
        buildUserMock({
          ...mockUser,
          passwordHash: undefined,
        })
      );

      await expect(authService.loginUser({ dto: loginDTO })).rejects.toThrow(
        UnauthorizedException
      );
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

    let hashTokenSpy: ReturnType<typeof jest.spyOn>;
    let getOneRefreshTokenSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      jest.clearAllMocks();

      hashTokenSpy = jest
        .spyOn(authUtils, "hashToken")
        .mockReturnValue(hashedToken);

      getOneRefreshTokenSpy = jest
        .spyOn(RefreshTokenRepository, "getOne")
        .mockResolvedValue(storedToken);
    });

    it("should successfully revoke a valid token", async () => {
      const result = await authService.revokeRefreshToken({ dto });

      expect(hashTokenSpy).toHaveBeenCalledWith(dto.refreshToken);
      expect(getOneRefreshTokenSpy).toHaveBeenCalledWith(
        hashedToken,
        expect.anything()
      );
      expect(dbSpies.mockDelete).toHaveBeenCalledWith(refreshTokens);
      expect(dbSpies.mockWhere).toHaveBeenCalledWith(
        eq(refreshTokens.id, storedToken.id)
      );
      expect(result).toEqual(storedToken);
    });

    it("should throw UnauthorizedException if token is not found", async () => {
      getOneRefreshTokenSpy.mockResolvedValue(null);
      await expect(authService.revokeRefreshToken({ dto })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException if token is already revoked", async () => {
      getOneRefreshTokenSpy.mockResolvedValue({
        ...storedToken,
        revoked: true,
      });
      await expect(authService.revokeRefreshToken({ dto })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException if token is expired", async () => {
      getOneRefreshTokenSpy.mockResolvedValue({
        ...storedToken,
        expiresAt: subDays(new Date(), 1),
      });
      await expect(authService.revokeRefreshToken({ dto })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should use provided transaction instance", async () => {
      await authService.revokeRefreshToken({ dto, txInstance: dbSpies.mockTx });
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

    let revokeRefreshTokenSpy: ReturnType<typeof jest.spyOn>;
    let generateAuthTokensSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      jest.clearAllMocks();

      getOneUserByIDSpy.mockResolvedValue(mockUser);

      revokeRefreshTokenSpy = jest
        .spyOn(authService, "revokeRefreshToken")
        .mockResolvedValue(storedToken);

      generateAuthTokensSpy = jest
        .spyOn(authService, "generateAuthTokens")
        .mockResolvedValue({
          accessToken: "new_access",
          refreshToken: "new_refresh",
        });
    });

    it("should successfully refresh tokens", async () => {
      const result = await authService.refreshAccessToken({
        dto,
        userIp: "127.0.0.1",
        userAgent: "jest",
      });

      expect(revokeRefreshTokenSpy).toHaveBeenCalledWith({
        dto,
        txInstance: dbSpies.mockTx,
      });

      expect(getOneUserByIDSpy).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
      expect(result).toEqual({
        accessToken: "new_access",
        refreshToken: "new_refresh",
        user: new UserDTO(mockUser).toJSON(),
      });
    });

    it("should propagate errors from revokeRefreshToken)", async () => {
      revokeRefreshTokenSpy.mockRejectedValueOnce(new UnauthorizedException());
      await expect(authService.refreshAccessToken({ dto })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw NotFoundException if user associated with token is not found", async () => {
      getOneUserByIDSpy.mockResolvedValue(null);
      await expect(authService.refreshAccessToken({ dto })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("registerDojoAdmin", () => {
    const mockSavedUser = buildUserMock({ id: "new-user-id" });

    const mockDojo = buildDojoMock({
      name: "My Dojo",
      tag: "DOJO",
      tagline: "The best",
      userId: mockSavedUser.id,
    });

    const userDTO = buildRegisterDojoAdminDTOMock({
      email: "new@user.com",
      username: "newuser",
      password: "password123",
      fullName: "New User",
      plan: StripePlans.Monthly,
      dojoName: mockDojo.name,
      dojoTag: mockDojo.tag,
      dojoTagline: mockDojo.tagline,
    });

    const mockStripeCustomer = buildStripeCustMock();
    const mockStripeSubscription = buildStripeSubMock();

    let hashPasswordSpy: ReturnType<typeof jest.spyOn>;
    let createStripeCustomerSpy: ReturnType<typeof jest.spyOn>;
    let createStripeSubscriptionSpy: ReturnType<typeof jest.spyOn>;
    let createDojoSpy: ReturnType<typeof jest.spyOn>;
    let setupBillingSpy: ReturnType<typeof jest.spyOn>;
    let sendWelcomeEmailSpy: ReturnType<typeof jest.spyOn>;
    let generateAuthTokensSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      // Default success path mocks
      getOneUserByEmailSpy.mockResolvedValue(null);
      getOneUserByUsernameSpy.mockResolvedValue(null);
      getOneDojoByTagSpy.mockResolvedValue(null);

      hashPasswordSpy = jest
        .spyOn(authUtils, "hashPassword")
        .mockResolvedValue("hashed_password");
      createStripeCustomerSpy = jest
        .spyOn(stripeService, "createCustomer")
        .mockResolvedValue(mockStripeCustomer as any);

      createStripeSubscriptionSpy = jest
        .spyOn(stripeService, "createSubscription")
        .mockResolvedValue(mockStripeSubscription as any);

      setupBillingSpy = jest
        .spyOn(SubscriptionService, "setupDojoAdminBilling")
        .mockResolvedValue({
          clientSecret: "test_secret",
        });
      saveUserSpy.mockResolvedValue(mockSavedUser);
      createDojoSpy = jest
        .spyOn(dojosService, "createDojo")
        .mockResolvedValue(mockDojo);
      sendWelcomeEmailSpy = jest
        .spyOn(mailerService, "sendWelcomeEmail")
        .mockResolvedValue();

      generateAuthTokensSpy = jest.spyOn(authService, "generateAuthTokens").mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });
    });

    it("should successfully register a DojoAdmin user", async () => {
      const result = await authService.registerDojoAdmin({ dto: userDTO });

      // 1. Check for existing users
      expect(getOneUserByEmailSpy).toHaveBeenCalledWith({
        email: userDTO.email,
        txInstance: dbSpies.mockTx,
      });
      expect(getOneUserByUsernameSpy).toHaveBeenCalledWith({
        username: userDTO.username,
        txInstance: dbSpies.mockTx,
      });
      expect(getOneDojoByTagSpy).toHaveBeenCalledWith(
        userDTO.dojoTag,
        dbSpies.mockTx
      );

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
        dbSpies.mockTx
      );

      expect(createDojoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockSavedUser.id,
          name: userDTO.dojoName,
        }),
        dbSpies.mockTx
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

      // 7. Final response
      expect(result.toJSON()).toEqual({
        stripeClientSecret: "test_secret",
        accessToken: "access",
        refreshToken: "refresh",
        user: new UserDTO(mockSavedUser).toJSON(),
      });
    });

    it("should throw ConflictException if email is already registered", async () => {
      getOneUserByEmailSpy.mockResolvedValue(buildUserMock());
      await expect(
        authService.registerDojoAdmin({ dto: userDTO })
      ).rejects.toThrow(ConflictException);
    });

    it("should throw ConflictException if username is already taken", async () => {
      getOneUserByUsernameSpy.mockResolvedValue(buildUserMock());
      await expect(
        authService.registerDojoAdmin({ dto: userDTO })
      ).rejects.toThrow(ConflictException);
    });

    it("should throw ConflictException if dojo tag is already taken", async () => {
      getOneDojoByTagSpy.mockResolvedValue(buildDojoMock());
      await expect(
        authService.registerDojoAdmin({ dto: userDTO })
      ).rejects.toThrow(ConflictException);
    });

    it("should consume and log mailer errors without failing the registration", async () => {
      const mailError = new Error("SMTP server down");
      sendWelcomeEmailSpy.mockRejectedValue(mailError);

      await expect(
        authService.registerDojoAdmin({ dto: userDTO })
      ).resolves.toBeDefined();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("An Error occurred while trying to send email"),
        mailError
      );
    });

    it("should use a provided transaction instance", async () => {
      await authService.registerDojoAdmin({ dto: userDTO }, dbSpies.mockTx);
      expect(dbService.runInTransaction).not.toHaveBeenCalled();
      expect(getOneUserByEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({ txInstance: dbSpies.mockTx })
      );
    });
  });

  describe("logoutUser", () => {
    const dto = buildRefreshTokenDtoMock({ refreshToken: "refresh_token" });
    let revokeRefreshTokenSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      revokeRefreshTokenSpy = jest
        .spyOn(authService, "revokeRefreshToken")
        .mockResolvedValue({} as any);
    });

    it("should successfully logout user by revoking token", async () => {
      await authService.logoutUser({ dto });
      expect(revokeRefreshTokenSpy).toHaveBeenCalledWith({
        dto,
        txInstance: expect.anything(),
      });
    });

    it("should propagate errors from revokeRefreshToken", async () => {
      revokeRefreshTokenSpy.mockRejectedValue(new UnauthorizedException());
      await expect(authService.logoutUser({ dto })).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe("isUsernameAvailable", () => {
    it("should return false if username is taken", async () => {
      getOneUserByUsernameSpy.mockResolvedValue(buildUserMock());

      const result = await authService.isUsernameAvailable({
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

      const result = await authService.isUsernameAvailable({
        username: "new_user",
      });

      expect(result).toBe(true);
    });

    it("should use provided transaction instance", async () => {
      getOneUserByUsernameSpy.mockResolvedValue(null);

      await authService.isUsernameAvailable({
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

      const result = await authService.isDojoTagAvailable({
        tag: "taken_tag",
      });

      expect(result).toBe(false);
      expect(getOneDojoByTagSpy).toHaveBeenCalledWith(
        "taken_tag",
        expect.anything()
      );
    });

    it("should return true if username is available", async () => {
      getOneDojoByTagSpy.mockResolvedValue(null);

      const result = await authService.isDojoTagAvailable({
        tag: "new_tag",
      });

      expect(result).toBe(true);
    });
  });

  describe("firebaseSignIn", () => {
    const tx = {} as any;

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

    let runInTxSpy: ReturnType<typeof jest.spyOn>;
    let verifyTokenSpy: ReturnType<typeof jest.spyOn>;
    let findByProviderSpy: ReturnType<typeof jest.spyOn>;
    let createOAuthAcctSpy: ReturnType<typeof jest.spyOn>;
    let updateSpy: ReturnType<typeof jest.spyOn>;
    let generateTokenSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      jest.clearAllMocks();

      runInTxSpy = jest
        .spyOn(dbService, "runInTransaction")
        .mockImplementation(async (cb) => cb(tx));

      verifyTokenSpy = jest
        .spyOn(firebaseService, "verifyFirebaseToken")
        .mockResolvedValue(firebaseUser);

      findByProviderSpy = jest
        .spyOn(UserOAuthAccountsRepository, "findByProviderAndProviderUserId")
        .mockResolvedValue(null);

      createOAuthAcctSpy = jest
        .spyOn(UserOAuthAccountsRepository, "createOAuthAcct")
        .mockResolvedValue(undefined);

      updateSpy = jest
        .spyOn(UserOAuthAccountsRepository, "updateOAuthAcct")
        .mockResolvedValue(undefined);

      generateTokenSpy = jest
        .spyOn(authService, "generateAuthTokens")
        .mockResolvedValue({
          accessToken: "access",
          refreshToken: "refresh",
        });

      getOneUserByEmailSpy.mockResolvedValue(user);
    });

    describe("transaction handling", () => {
      it("should run inside dbService.runInTransaction when txInstance is not provided", async () => {
        const result = await authService.firebaseSignIn({ dto });

        expect(runInTxSpy).toHaveBeenCalled();
        expect(result).toBeInstanceOf(AuthResponseDTO);
      });
    });

    it("should throw UnauthorizedException if Firebase email is not verified", async () => {
      verifyTokenSpy.mockResolvedValue({
        ...firebaseUser,
        emailVerified: false,
      });

      await expect(
        authService.firebaseSignIn({ dto, txInstance: tx })
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        authService.firebaseSignIn({ dto, txInstance: tx })
      ).rejects.toThrow("Social Auth Email not verified");
    });

    it("should throw NotFoundException if user does not exist", async () => {
      getOneUserByEmailSpy.mockResolvedValue(null);

      await expect(
        authService.firebaseSignIn({ dto, txInstance: tx })
      ).rejects.toThrow(NotFoundException);
    });

    it("should create OAuth account if none exists", async () => {
      findByProviderSpy.mockResolvedValue(null);

      const result = await authService.firebaseSignIn({
        dto,
        txInstance: tx,
      });

      expect(createOAuthAcctSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          dto: expect.objectContaining({
            userId: user.id,
            provider: firebaseUser.provider,
            providerUserId: firebaseUser.uid,
          }),
        })
      );

      expect(result).toBeInstanceOf(AuthResponseDTO);
    });

    it("should update OAuth account if it already exists", async () => {
      findByProviderSpy.mockResolvedValue(
        buildOAuthAcctMock({ id: "oauth-id" })
      );

      const result = await authService.firebaseSignIn({
        dto,
        txInstance: tx,
      });

      expect(updateSpy).toHaveBeenCalled();
      expect(result.user).toBeInstanceOf(UserDTO);
    });

    it("should pass userIp and userAgent to generateAuthTokens", async () => {
      findByProviderSpy.mockResolvedValue(null);

      await authService.firebaseSignIn({
        dto,
        userIp: "127.0.0.1",
        userAgent: "jest",
        txInstance: tx,
      });

      expect(generateTokenSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          userIp: "127.0.0.1",
          userAgent: "jest",
        })
      );
    });
  });

  describe("initForgetPassword", () => {
    const dto = { email: "test@example.com" };
    const user = buildUserMock({ email: dto.email });

    let updateOTPSpy: ReturnType<typeof jest.spyOn>;
    let createOTPSpy: ReturnType<typeof jest.spyOn>;
    let generateOTPSpy: ReturnType<typeof jest.spyOn>;
    let hashTokenSpy: ReturnType<typeof jest.spyOn>;
    let sendPasswordResetMailSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      updateOTPSpy = jest
        .spyOn(PasswordResetOTPRepository, "updateOTP")
        .mockResolvedValue(undefined);
      createOTPSpy = jest
        .spyOn(PasswordResetOTPRepository, "createOTP")
        .mockResolvedValue(undefined);
      generateOTPSpy = jest
        .spyOn(authUtils, "generateOTP")
        .mockReturnValue("123456");
      hashTokenSpy = jest
        .spyOn(authUtils, "hashToken")
        .mockReturnValue("hashed_otp");
      sendPasswordResetMailSpy = jest
        .spyOn(mailerService, "sendPasswordResetMail")
        .mockResolvedValue(undefined);
    });

    it("should initiate password reset for existing user", async () => {
      getOneUserByEmailSpy.mockResolvedValue(user);

      await authService.initForgetPassword({ dto });

      expect(getOneUserByEmailSpy).toHaveBeenCalledWith({
        email: dto.email,
        txInstance: expect.anything(),
      });
      expect(updateOTPSpy).toHaveBeenCalledWith({
        tx: expect.anything(),
        update: { used: true },
        whereClause: expect.anything(),
      });
      expect(generateOTPSpy).toHaveBeenCalled();
      expect(hashTokenSpy).toHaveBeenCalledWith("123456");
      expect(createOTPSpy).toHaveBeenCalledWith({
        tx: expect.anything(),
        dto: expect.objectContaining({
          userId: user.id,
          hashedOTP: "hashed_otp",
          attempts: 0,
        }),
      });
      expect(sendPasswordResetMailSpy).toHaveBeenCalledWith({
        dest: user.email,
        name: user.name,
        otp: "123456",
      });
    });

    it("should silently fail if user is not found", async () => {
      getOneUserByEmailSpy.mockResolvedValue(null);

      await authService.initForgetPassword({ dto });

      expect(getOneUserByEmailSpy).toHaveBeenCalled();
      expect(updateOTPSpy).not.toHaveBeenCalled();
      expect(sendPasswordResetMailSpy).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    const dto = { resetToken: "valid_token", newPassword: "new_password" };
    const decodedToken = { userId: "user-1", scope: "password_reset" };

    let verifyTokenSpy: ReturnType<typeof jest.spyOn>;
    let hashPasswordSpy: ReturnType<typeof jest.spyOn>;
    let updateUserSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      verifyTokenSpy = jest
        .spyOn(authUtils, "verifyPasswordResetToken")
        .mockReturnValue(decodedToken);
      hashPasswordSpy = jest
        .spyOn(authUtils, "hashPassword")
        .mockResolvedValue("new_hashed_password");
      updateUserSpy = jest
        .spyOn(userService, "updateUser")
        .mockResolvedValue(undefined);
    });

    it("should reset password and revoke refresh tokens", async () => {
      await authService.resetPassword({ dto });

      expect(verifyTokenSpy).toHaveBeenCalledWith(dto.resetToken);
      expect(hashPasswordSpy).toHaveBeenCalledWith(dto.newPassword);
      expect(updateUserSpy).toHaveBeenCalledWith({
        txInstance: expect.anything(),
        userId: decodedToken.userId,
        update: { passwordHash: "new_hashed_password" },
      });

      expect(dbSpies.mockDelete).toHaveBeenCalledWith(refreshTokens);
      expect(dbSpies.mockWhere).toHaveBeenCalledWith(
        eq(refreshTokens.userId, decodedToken.userId)
      );
    });

    it("should throw if token verification fails", async () => {
      verifyTokenSpy.mockImplementation(() => {
        throw new BadRequestException("Invalid token");
      });

      await expect(authService.resetPassword({ dto })).rejects.toThrow(
        BadRequestException
      );
      expect(updateUserSpy).not.toHaveBeenCalled();
    });
  });

  describe("verifyOtp", () => {
    const dto = { email: "test@example.com", otp: "123456" };
    const user = buildUserMock({ email: dto.email });
    const otpRecord = {
      id: "otp-id",
      userId: user.id,
      hashedOTP: "hashed_otp",
      attempts: 0,
      expiresAt: addDays(new Date(), 1),
      used: false,
    };

    let findOneOTPSpy: ReturnType<typeof jest.spyOn>;
    let incrementAttemptsSpy: ReturnType<typeof jest.spyOn>;
    let updateOneOTPSpy: ReturnType<typeof jest.spyOn>;
    let generateResetTokenSpy: ReturnType<typeof jest.spyOn>;
    let hashTokenSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      jest.useFakeTimers();
      findOneOTPSpy = jest.spyOn(PasswordResetOTPRepository, "findOne");
      incrementAttemptsSpy = jest
        .spyOn(PasswordResetOTPRepository, "incrementActiveOTPsAttempts")
        .mockResolvedValue(undefined);
      updateOneOTPSpy = jest
        .spyOn(PasswordResetOTPRepository, "updateOneOTP")
        .mockResolvedValue(undefined);
      generateResetTokenSpy = jest
        .spyOn(authUtils, "generatePasswordResetToken")
        .mockReturnValue("reset_token");
      hashTokenSpy = jest
        .spyOn(authUtils, "hashToken")
        .mockReturnValue("hashed_otp");
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should verify OTP successfully and return reset token", async () => {
      getOneUserByEmailSpy.mockResolvedValue(user);
      findOneOTPSpy.mockResolvedValue(otpRecord);

      const result = await authService.verifyOtp({ dto });

      expect(getOneUserByEmailSpy).toHaveBeenCalledWith({
        email: dto.email,
        txInstance: expect.anything(),
      });
      expect(hashTokenSpy).toHaveBeenCalledWith(dto.otp);
      expect(findOneOTPSpy).toHaveBeenCalled();
      expect(updateOneOTPSpy).toHaveBeenCalledWith({
        tx: expect.anything(),
        otpID: otpRecord.id,
        update: { used: true },
      });
      expect(generateResetTokenSpy).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({ resetToken: "reset_token" });
    });

    it("should throw BadRequestException if user not found", async () => {
      getOneUserByEmailSpy.mockResolvedValue(null);
      await expect(authService.verifyOtp({ dto })).rejects.toThrow(
        BadRequestException
      );
    }, 10000);

    it("should throw BadRequestException if OTP not found or invalid", async () => {
      getOneUserByEmailSpy.mockResolvedValue(user);
      findOneOTPSpy.mockResolvedValue(null);

      await expect(authService.verifyOtp({ dto })).rejects.toThrow(
        BadRequestException
      );

      expect(incrementAttemptsSpy).toHaveBeenCalledWith({
        tx: expect.anything(),
        userId: user.id,
      });
    });

    it("should throw TooManyRequestsException if max attempts reached", async () => {
      getOneUserByEmailSpy.mockResolvedValue(user);
      const exhaustedOtp = {
        ...otpRecord,
        attempts: AppConstants.MAX_OTP_VERIFICATION_ATTEMPTS,
      };
      findOneOTPSpy.mockResolvedValue(exhaustedOtp);

      await expect(authService.verifyOtp({ dto })).rejects.toThrow(
        TooManyRequestsException
      );

      expect(updateOneOTPSpy).toHaveBeenCalledWith({
        tx: expect.anything(),
        otpID: exhaustedOtp.id,
        update: {
          used: true,
          attempts: exhaustedOtp.attempts + 1,
        },
      });
    });
  });
});

const impoev = `This test suite provides a solid foundation for your authentication service. It uses Jest's mocking capabilities to isolate the service and test its logic in a controlled environment, ensuring each part works as expected. <!--
[PROMPT_SUGGESTION]Can you write integration tests for the user registration endpoint ('/auth/register')?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Refactor the test setup to reduce boilerplate code across the different test files.[/PROMPT_SUGGESTION]
`;
