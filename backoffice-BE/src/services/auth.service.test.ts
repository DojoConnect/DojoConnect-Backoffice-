import * as authService from "./auth.service";
import * as dbService from "../db";
import * as userService from "./users.service";
import * as stripeService from "./stripe.service";
import * as dojosService from "./dojos.service";
import * as mailerService from "./mailer.service";
import * as authUtils from "../utils/auth.utils";
import {
  createDrizzleDbSpies,
  DbServiceSpies,
} from "../tests/spies/drizzle-db.spies";
import { buildUserMock } from "../tests/factories/user.factory";
import {
  buildStripeCustMock,
  buildStripeSubMock,
} from "../tests/factories/stripe.factory";
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "../core/errors";
import { Role, StripePlans } from "../constants/enums";
import { addDays, subDays } from "date-fns";
import { refreshTokens } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  buildLoginDTOMock,
  buildNewRefreshTokenMock,
  buildRefreshTokenDtoMock,
  buildRefreshTokenMock,
  buildRegisterUserDTOMock,
} from "../tests/factories/auth.factory";
import { buildDojoMock } from "../tests/factories/dojos.factory";
import { UserDTO } from "../dtos/user.dtos";

describe("Auth Service", () => {
  let dbSpies: DbServiceSpies;
  let logSpy: jest.SpyInstance;

  let getOneUserByEmailSpy: jest.SpyInstance;
  let getOneUserByUsernameSpy: jest.SpyInstance;
  let saveUserSpy: jest.SpyInstance;
  let getOneUserByIDSpy: jest.SpyInstance;

  beforeEach(() => {
    dbSpies = createDrizzleDbSpies();

    getOneUserByEmailSpy = jest.spyOn(userService, "getOneUserByEmail");
    getOneUserByIDSpy = jest.spyOn(userService, "getOneUserByID");
    getOneUserByUsernameSpy = jest.spyOn(userService, "getOneUserByUserName");
    saveUserSpy = jest.spyOn(userService, "saveUser");

    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getOneUser", () => {
    const hashedToken = "hashed_token";

    const storedToken = buildRefreshTokenMock({
      id: "token-id",
      userId: "user-123",
      hashedToken: "hashed_token",
      revoked: false,
      expiresAt: addDays(new Date(), 1),
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should return null when no token is found", async () => {
      dbSpies.mockExecute.mockResolvedValue([]);

      const result = await authService.getOneRefreshToken(
        hashedToken,
        dbSpies.mockTx
      );

      expect(dbSpies.mockSelect).toHaveBeenCalled();
      expect(dbSpies.mockFrom).toHaveBeenCalledWith(refreshTokens);
      expect(dbSpies.mockLimit).toHaveBeenCalledWith(1);
      expect(result).toBeNull();
    });

    it("should return refresh token when there is a match in db", async () => {
      dbSpies.mockExecute.mockResolvedValue([storedToken]);

      const result = await authService.getOneRefreshToken(
        hashedToken,
        dbSpies.mockTx
      );

      expect(result).toEqual(storedToken);
    });

    it("calls dbService.runInTransaction when no transaction instance is provided", async () => {
      dbSpies.mockExecute.mockResolvedValue([storedToken]);

      const result = await authService.getOneRefreshToken(hashedToken);

      expect(dbSpies.runInTransactionSpy).toHaveBeenCalled();
    });
  });

  describe("saveRefreshToken", () => {
    const tokenData = buildNewRefreshTokenMock({
      userId: "user-1",
      hashedToken: "hashed",
      expiresAt: new Date(),
    });

    it("should insert a new refresh token", async () => {
      await authService.saveRefreshToken(tokenData);
      expect(dbSpies.mockInsert).toHaveBeenCalledWith(refreshTokens);
      expect(dbSpies.mockValues).toHaveBeenCalledWith(tokenData);
    });

    it("should use a provided transaction instance", async () => {
      await authService.saveRefreshToken(tokenData, dbSpies.mockTx);
      expect(dbService.runInTransaction).not.toHaveBeenCalled();
    });
  });

  describe("deleteRefreshToken", () => {
    it("should delete a refresh token by its ID", async () => {
      const tokenId = "token-id-123";
      await authService.deleteRefreshToken(tokenId);
      expect(dbSpies.mockDelete).toHaveBeenCalledWith(refreshTokens);
      expect(dbSpies.mockWhere).toHaveBeenCalledWith(
        eq(refreshTokens.id, tokenId)
      );
    });

    it("should use a provided transaction instance", async () => {
      await authService.deleteRefreshToken("id", dbSpies.mockTx);
      expect(dbService.runInTransaction).not.toHaveBeenCalled();
    });
  });

  describe("generateAuthTokens", () => {
    const mockUser = buildUserMock({ role: Role.DojoAdmin });

    let generateAccessTokenSpy: jest.SpyInstance;
    let generateRefreshTokenSpy: jest.SpyInstance;
    let hashTokenSpy: jest.SpyInstance;

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

    let verifyPasswordSpy: jest.SpyInstance;
    let updateUserSpy: jest.SpyInstance;
    let generateAuthTokensSpy: jest.SpyInstance;

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

    let hashTokenSpy: jest.SpyInstance;
    let getOneRefreshTokenSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();

      hashTokenSpy = jest
        .spyOn(authUtils, "hashToken")
        .mockReturnValue(hashedToken);

      getOneRefreshTokenSpy = jest
        .spyOn(authService, "getOneRefreshToken")
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

    let revokeRefreshTokenSpy: jest.SpyInstance;
    let generateAuthTokensSpy: jest.SpyInstance;

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

  describe("registerUser", () => {
    const mockDojo = buildDojoMock({
      name: "My Dojo",
      tag: "DOJO",
      tagline: "The best",
    });

    const userDTO = buildRegisterUserDTOMock({
      email: "new@user.com",
      username: "newuser",
      password: "password123",
      fullName: "New User",
      role: Role.DojoAdmin,
      plan: StripePlans.Starter,
      paymentMethod: "pm_123",
      dojoName: mockDojo.name,
      dojoTag: mockDojo.tag,
      dojoTagline: mockDojo.tagline,
    });

    const mockSavedUser = buildUserMock({ id: "new-user-id" });
    const mockStripeCustomer = buildStripeCustMock();
    const mockStripeSubscription = buildStripeSubMock();

    let hashPasswordSpy: jest.SpyInstance;
    let createStripeCustomerSpy: jest.SpyInstance;
    let createStripeSubscriptionSpy: jest.SpyInstance;
    let saveDojoSpy: jest.SpyInstance;
    let setDefaultPaymentMethodSpy: jest.SpyInstance;
    let sendWelcomeEmailSpy: jest.SpyInstance;

    beforeEach(() => {
      // Default success path mocks
      getOneUserByEmailSpy.mockResolvedValue(null);
      getOneUserByUsernameSpy.mockResolvedValue(null);

      hashPasswordSpy = jest
        .spyOn(authUtils, "hashPassword")
        .mockResolvedValue("hashed_password");
      createStripeCustomerSpy = jest
        .spyOn(stripeService, "createCustomers")
        .mockResolvedValue(mockStripeCustomer as any);

      createStripeSubscriptionSpy = jest
        .spyOn(stripeService, "createSubscription")
        .mockResolvedValue(mockStripeSubscription as any);
      saveUserSpy.mockResolvedValue(mockSavedUser);
      setDefaultPaymentMethodSpy = jest
        .spyOn(userService, "setDefaultPaymentMethod")
        .mockResolvedValue();
      saveDojoSpy = jest
        .spyOn(dojosService, "saveDojo")
        .mockResolvedValue(mockDojo.id);
      sendWelcomeEmailSpy = jest
        .spyOn(mailerService, "sendWelcomeEmail")
        .mockResolvedValue();

      jest.spyOn(authService, "generateAuthTokens").mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });
    });

    it("should successfully register a DojoAdmin user", async () => {
      const result = await authService.registerUser({ userDTO });

      // 1. Check for existing users
      expect(getOneUserByEmailSpy).toHaveBeenCalledWith({
        email: userDTO.email,
        txInstance: dbSpies.mockTx,
      });
      expect(getOneUserByUsernameSpy).toHaveBeenCalledWith({
        username: userDTO.username,
        txInstance: dbSpies.mockTx,
      });

      // 2. Stripe calls
      expect(createStripeCustomerSpy).toHaveBeenCalledWith(
        userDTO.fullName,
        userDTO.email,
        userDTO.paymentMethod
      );
      expect(createStripeSubscriptionSpy).toHaveBeenCalledWith(
        mockStripeCustomer,
        userDTO.plan
      );

      // 3. Save user
      expect(saveUserSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userDTO.email,
          passwordHash: "hashed_password",
          stripeCustomerId: mockStripeCustomer.id,
          stripeSubscriptionId: mockStripeSubscription.id,
        }),
        dbSpies.mockTx
      );

      // 4. Set default payment and save dojo
      expect(setDefaultPaymentMethodSpy).toHaveBeenCalledWith(
        mockSavedUser,
        userDTO.paymentMethod,
        dbSpies.mockTx
      );
      expect(saveDojoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockSavedUser.id,
          name: userDTO.dojoName,
        }),
        dbSpies.mockTx
      );

      // 5. Generate tokens
      expect(authService.generateAuthTokens).toHaveBeenCalledWith({
        user: mockSavedUser,
        userAgent: undefined,
        userIp: undefined,
        txInstance: dbSpies.mockTx,
      });

      // 6. Send email
      expect(sendWelcomeEmailSpy).toHaveBeenCalled();

      // 7. Final response
      expect(result.toJSON()).toEqual({
        accessToken: "access",
        refreshToken: "refresh",
        user: new UserDTO(mockSavedUser).toJSON(),
      });
    });

    it("should throw ConflictException if email is already registered", async () => {
      getOneUserByEmailSpy.mockResolvedValue(buildUserMock());
      await expect(authService.registerUser({ userDTO })).rejects.toThrow(
        ConflictException
      );
    });

    it("should throw ConflictException if username is already taken", async () => {
      getOneUserByUsernameSpy.mockResolvedValue(buildUserMock());
      await expect(authService.registerUser({ userDTO })).rejects.toThrow(
        ConflictException
      );
    });

    it("should not make stripe/dojo calls for a non-DojoAdmin role", async () => {
      const nonAdminDTO = { ...userDTO, role: Role.Parent };
      await authService.registerUser({ userDTO: nonAdminDTO });

      expect(createStripeCustomerSpy).not.toHaveBeenCalled();
      expect(createStripeSubscriptionSpy).not.toHaveBeenCalled();
      expect(setDefaultPaymentMethodSpy).not.toHaveBeenCalled();
      expect(saveDojoSpy).not.toHaveBeenCalled();
      expect(saveUserSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeCustomerId: null,
        }),
        dbSpies.mockTx
      );
    });

    it("should consume and log mailer errors without failing the registration", async () => {
      const mailError = new Error("SMTP server down");
      sendWelcomeEmailSpy.mockRejectedValue(mailError);

      await expect(
        authService.registerUser({ userDTO })
      ).resolves.toBeDefined();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("An Error occurred while trying to send email"),
        mailError
      );
    });

    it("should use a provided transaction instance", async () => {
      await authService.registerUser({ userDTO }, dbSpies.mockTx);
      expect(dbService.runInTransaction).not.toHaveBeenCalled();
      expect(getOneUserByEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({ txInstance: dbSpies.mockTx })
      );
    });
  });

  describe("logoutUser", () => {
    const dto = buildRefreshTokenDtoMock({ refreshToken: "refresh_token" });
    let revokeRefreshTokenSpy: jest.SpyInstance;

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

    it("should use provided transaction instance", async () => {
      await authService.logoutUser({ dto, txInstance: dbSpies.mockTx });
      expect(dbService.runInTransaction).not.toHaveBeenCalled();
      expect(revokeRefreshTokenSpy).toHaveBeenCalledWith({
        dto,
        txInstance: dbSpies.mockTx,
      });
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
});

const impoev = `This test suite provides a solid foundation for your authentication service. It uses Jest's mocking capabilities to isolate the service and test its logic in a controlled environment, ensuring each part works as expected. <!--
[PROMPT_SUGGESTION]Can you write integration tests for the user registration endpoint ('/auth/register')?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Refactor the test setup to reduce boilerplate code across the different test files.[/PROMPT_SUGGESTION]
`;
