import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock, MockInstance } from "vitest";

import {UsersService} from "./users.service.js";
import {
  createDrizzleDbSpies,
  DbServiceSpies,
} from "../tests/spies/drizzle-db.spies.js";
import { userCards, users } from "../db/schema.js";
import {
  buildNewUserMock,
  buildUserCardMock,
  buildUserMock,
} from "../tests/factories/user.factory.js";
import { eq } from "drizzle-orm";
import { NotFoundException } from "../core/errors/index.js";
import { buildStripePaymentMethodCardMock } from "../tests/factories/stripe.factory.js";

describe("Users Service", () => {
  const whereClause = eq(users.id, "1");

  let mockExecute: Mock;
  let mockSelect: Mock;
  let mockFrom: Mock;
  let mockLimit: Mock;
  let dbSpies: DbServiceSpies;
  let logErrorSpy: MockInstance;

  beforeEach(() => {
    dbSpies = createDrizzleDbSpies();

    mockExecute = dbSpies.mockExecute;
    mockSelect = dbSpies.mockSelect;
    mockFrom = dbSpies.mockFrom;
    mockLimit = dbSpies.mockLimit;

    logErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getOneUser", () => {
    it("should return null when no user is found", async () => {
      mockExecute.mockResolvedValue([]);

      const result = await UsersService.getOneUser({ whereClause });

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(users);
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(result).toBeNull();
    });

    it("should return user WITHOUT passwordHash when withPassword = false (default)", async () => {
      const mockUser = buildUserMock({
        id: "1",
        firstName: "John",
        passwordHash: "hashed_pw",
      });

      const { passwordHash, ...userWithoutPassword } = mockUser;

      mockExecute.mockResolvedValue([mockUser]);

      const result = await UsersService.getOneUser({
        whereClause,
        withPassword: false,
      });

      expect(result).toEqual(userWithoutPassword);
      expect(result).not.toHaveProperty("passwordHash");
    });

    it("returns user WITH passwordHash when withPassword = true", async () => {
      const mockUser = buildUserMock({
        id: "1",
        firstName: "John",
        passwordHash: "hashed_pw",
      });

      mockExecute.mockResolvedValue([mockUser]);

      const result = await UsersService.getOneUser({
        whereClause,
        withPassword: true,
      });

      expect(result).toEqual(mockUser);
      expect(result).toHaveProperty("passwordHash");
    });

    it("calls dbService.runInTransaction when no transaction instance is provided", async () => {
      const mockUser = buildUserMock({ id: "1", passwordHash: "hash" });
      mockExecute.mockResolvedValue([mockUser]);

      const result = await UsersService.getOneUser({ whereClause });

      expect(dbSpies.runInTransactionSpy).toHaveBeenCalled();
    });

    it("correctly builds the SQL query with provided whereClause", async () => {
      const mockUser = buildUserMock({ id: "1", passwordHash: "pw" });
      mockExecute.mockResolvedValue([mockUser]);

      const whereClause = eq(users.email, "test@example.com");

      await UsersService.getOneUser({
        whereClause,
      });

      expect(dbSpies.mockWhere).toHaveBeenCalledWith(whereClause);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });
  });

  describe("getOneUserByID", () => {
    let getOneUserSpy: MockInstance;

    beforeEach(() => {
      getOneUserSpy = vi.spyOn(UsersService, "getOneUser");
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should call getOneUser with correct whereClause and return user", async () => {
      const id = "123";
      const mockUser = buildUserMock({ id });

      getOneUserSpy.mockResolvedValue(mockUser);

      const result = await UsersService.getOneUserByID({ userId: id });

      expect(getOneUserSpy).toHaveBeenCalledWith(
        { whereClause: eq(users.id, id) },
        expect.anything() // tx
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null when no user is found", async () => {
      const userId = "non-existent-id";

      getOneUserSpy.mockResolvedValue(null);

      const result = await UsersService.getOneUserByID({ userId });

      expect(result).toBeNull();
    });

    it("should log error and throw when underlying getOneUser throws", async () => {
      const userId = "fail@example.com";

      const testError = new Error("DB failed");
      getOneUserSpy.mockRejectedValueOnce(testError);

      logErrorSpy.mockImplementation(() => {});

      await expect(UsersService.getOneUserByID({ userId })).rejects.toThrow(
        "DB failed"
      );

      expect(logErrorSpy).toHaveBeenCalledWith(
        `Error fetching user by ID: ${userId}`,
        { err: testError }
      );
    });
  });

  describe("getOneUserByEmail", () => {
    let getOneUserSpy: MockInstance;

    beforeEach(() => {
      getOneUserSpy = vi.spyOn(UsersService, "getOneUser");
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should call getOneUser with correct whereClause and return user", async () => {
      const email = "test@example.com";
      const mockUser = buildUserMock({ email });

      getOneUserSpy.mockResolvedValue(mockUser);

      const result = await UsersService.getOneUserByEmail({ email });

      expect(getOneUserSpy).toHaveBeenCalledWith(
        { whereClause: eq(users.email, email), withPassword: false },
        expect.anything() // tx
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null when no user is found", async () => {
      const email = "missing@example.com";

      getOneUserSpy.mockResolvedValue(null);

      const result = await UsersService.getOneUserByEmail({ email });

      expect(result).toBeNull();
    });

    it("should request password when withPassword = true", async () => {
      const email = "secure@example.com";
      const mockUser = buildUserMock({ email, passwordHash: "hash123" });

      getOneUserSpy.mockResolvedValue(mockUser);

      const result = await UsersService.getOneUserByEmail({
        email,
        withPassword: true,
      });

      expect(getOneUserSpy).toHaveBeenCalledWith(
        { whereClause: eq(users.email, email), withPassword: true },
        expect.anything()
      );

      expect(result).toEqual(mockUser);
      expect(result?.passwordHash).toBe("hash123");
    });

    it("should call dbService.runInTransaction when no txInstance is supplied", async () => {
      const email = "user@example.com";
      const mockUser = buildUserMock({ email });

      getOneUserSpy.mockResolvedValue(mockUser);

      const result = await UsersService.getOneUserByEmail({ email });

      expect(dbSpies.runInTransactionSpy).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it("should NOT call dbService.runInTransaction when txInstance is supplied", async () => {
      const email = "user@example.com";
      const mockUser = buildUserMock({ email });

      getOneUserSpy.mockResolvedValue(mockUser);

      const tx = dbSpies.mockTx;

      await UsersService.getOneUserByEmail({
        email,
        txInstance: tx,
      });

      expect(dbSpies.runInTransactionSpy).not.toHaveBeenCalled();
      expect(getOneUserSpy).toHaveBeenCalled();
    });

    it("should log error and throw when underlying getOneUser throws", async () => {
      const email = "fail@example.com";

      const testError = new Error("DB failed");
      getOneUserSpy.mockRejectedValue(testError);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(UsersService.getOneUserByEmail({ email })).rejects.toThrow(
        "DB failed"
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        `Error fetching user by Email: ${email}`,
        { err: testError }
      );
    });
  });

  describe("getOneUserByUsername", () => {
    let getOneUserSpy: MockInstance;

    beforeEach(() => {
      getOneUserSpy = vi.spyOn(UsersService, "getOneUser");
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should call getOneDojo with correct whereClause and return user", async () => {
      const username = "user-123";
      const mockDojo = buildUserMock({ username });

      getOneUserSpy.mockResolvedValue(mockDojo);

      const result = await UsersService.getOneUserByUserName({ username });

      expect(getOneUserSpy).toHaveBeenCalledWith(
        { whereClause: eq(users.username, username) },
        expect.anything()
      );
      expect(result).toEqual(mockDojo);
    });

    it("should return null when no dojo is found", async () => {
      const username = "non-existent-username";

      getOneUserSpy.mockResolvedValue(null);

      const result = await UsersService.getOneUserByUserName({ username });

      expect(result).toBeNull();
    });

    it("should log error and throw when underlying getOneDojo throws", async () => {
      const username = "failure";

      const testError = new Error("DB failed");
      getOneUserSpy.mockRejectedValueOnce(testError);

      logErrorSpy.mockImplementation(() => {});

      await expect(
        UsersService.getOneUserByUserName({ username })
      ).rejects.toThrow("DB failed");

      expect(logErrorSpy).toHaveBeenCalledWith(
        `Error fetching dojo by Username: ${username}`,
        { err: testError }
      );
    });
  });

  describe("fetchUserCards", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return user cards for a given user ID", async () => {
      const userId = "user-1";
      const mockCards = [
        buildUserCardMock({ userId }),
        buildUserCardMock({ userId }),
      ];
      mockExecute.mockResolvedValue(mockCards);

      const result = await UsersService.fetchUserCards(userId);

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(userCards);
      expect(dbSpies.mockWhere).toHaveBeenCalledWith(
        eq(userCards.userId, userId)
      );
      expect(result).toEqual(mockCards);
    });

    it("should return an empty array if no cards are found", async () => {
      const userId = "user-with-no-cards";
      mockExecute.mockResolvedValue([]);

      const result = await UsersService.fetchUserCards(userId);

      expect(result).toEqual([]);
    });

    it("should log error and re-throw when the database query fails", async () => {
      const userId = "user-1";
      const testError = new Error("DB query failed");
      mockExecute.mockRejectedValue(testError);

      await expect(UsersService.fetchUserCards(userId)).rejects.toThrow(
        testError
      );

      expect(logErrorSpy).toHaveBeenCalledWith(
        `Error fetching user cards for user ID: ${userId}`,
        { err: testError }
      );
    });
  });

  describe("fetchUserCardsByPaymentMethod", () => {
    it("should return user cards for a given payment method ID", async () => {
      const paymentMethodId = "pm_123";
      const mockCards = [
        buildUserCardMock({ paymentMethodId }),
        buildUserCardMock({ paymentMethodId }),
      ];
      mockExecute.mockResolvedValue(mockCards);

      const result = await UsersService.fetchUserCardsByPaymentMethod(
        paymentMethodId
      );

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(userCards);
      expect(dbSpies.mockWhere).toHaveBeenCalledWith(
        eq(userCards.paymentMethodId, paymentMethodId)
      );
      expect(result).toEqual(mockCards);
    });

    it("should return an empty array if no cards are found", async () => {
      const paymentMethodId = "pm_not_found";
      mockExecute.mockResolvedValue([]);

      const result = await UsersService.fetchUserCardsByPaymentMethod(
        paymentMethodId
      );

      expect(result).toEqual([]);
    });

    it("should call dbService.runInTransaction when no txInstance is provided", async () => {
      const paymentMethodId = "pm_123";
      mockExecute.mockResolvedValue([]);

      await UsersService.fetchUserCardsByPaymentMethod(paymentMethodId);

      expect(dbSpies.runInTransactionSpy).toHaveBeenCalled();
    });

    it("should NOT call dbService.runInTransaction when a txInstance is provided", async () => {
      const paymentMethodId = "pm_123";
      mockExecute.mockResolvedValue([]);

      await UsersService.fetchUserCardsByPaymentMethod(
        paymentMethodId,
        dbSpies.mockTx
      );

      expect(dbSpies.runInTransactionSpy).not.toHaveBeenCalled();
    });

    it("should log error and re-throw when the database query fails", async () => {
      const paymentMethodId = "pm_fail";
      const testError = new Error("DB query failed");
      mockExecute.mockRejectedValue(testError);

      await expect(
        UsersService.fetchUserCardsByPaymentMethod(paymentMethodId)
      ).rejects.toThrow(testError);

      expect(logErrorSpy).toHaveBeenCalledWith(
        `Error fetching user cards by payment method: ${paymentMethodId}`,
        { err: testError }
      );
    });
  });

  describe("saveUser", () => {
    let getOneUserByIDSpy: MockInstance;

    beforeEach(() => {
      getOneUserByIDSpy = vi.spyOn(UsersService, "getOneUserByID");
    });

    it("should insert a new user, fetch it, and return it", async () => {
      const newUser = buildNewUserMock({
        email: "new@user.com",
      });
      const newUserId = "new-user-id-123";
      const mockSavedUser = buildUserMock({ id: newUserId, ...newUser });

      dbSpies.mockReturningId.mockResolvedValue([{ id: newUserId }]);

      getOneUserByIDSpy.mockResolvedValue(mockSavedUser);

      const result = await UsersService.saveUser(newUser);

      expect(dbSpies.mockInsert).toHaveBeenCalledWith(users);
      expect(dbSpies.mockValues).toHaveBeenCalledWith(newUser);
      expect(dbSpies.mockReturningId).toHaveBeenCalled();
      expect(getOneUserByIDSpy).toHaveBeenCalledWith({
        userId: newUserId,
        txInstance: expect.any(Object), // The transaction instance
      });
      expect(result).toEqual(mockSavedUser);
    });

    it("should use the provided transaction instance", async () => {
      const newUser = buildNewUserMock({
        email: "tx@user.com",
      });
      const newUserId = "new-user-id-456";
      const mockSavedUser = buildUserMock({ id: newUserId, ...newUser });

      dbSpies.mockReturningId.mockResolvedValue([{ id: newUserId }]);
      getOneUserByIDSpy.mockResolvedValue(mockSavedUser);

      await UsersService.saveUser(newUser, dbSpies.mockTx);

      expect(dbSpies.runInTransactionSpy).not.toHaveBeenCalled();
      expect(getOneUserByIDSpy).toHaveBeenCalledWith({
        userId: newUserId,
        txInstance: dbSpies.mockTx,
      });
    });
  });

  describe("saveUserCard", () => {
    it("should insert a new user card", async () => {
      const newUserCard = buildUserCardMock();
      const mockValues = vi.fn().mockResolvedValue(undefined);
      dbSpies.mockInsert.mockReturnValue({ values: mockValues });

      await UsersService.saveUserCard(newUserCard);

      expect(dbSpies.runInTransactionSpy).toHaveBeenCalled();
      expect(dbSpies.mockInsert).toHaveBeenCalledWith(userCards);
      expect(mockValues).toHaveBeenCalledWith(newUserCard);
    });

    it("should use the provided transaction instance", async () => {
      await UsersService.saveUserCard(buildUserCardMock(), dbSpies.mockTx);
      expect(dbSpies.runInTransactionSpy).not.toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    it("should call update on the users table with the correct data and where clause", async () => {
      const userId = "user-to-update-123";
      const updateData = { name: "A New Name", fcmToken: "a-new-fcm-token" };

      await UsersService.updateUser({ userId, update: updateData });

      expect(dbSpies.mockUpdate).toHaveBeenCalledWith(users);
      expect(dbSpies.mockSet).toHaveBeenCalledWith(updateData);
      expect(dbSpies.mockWhere).toHaveBeenCalledWith(eq(users.id, userId));
    });

    it("should call dbService.runInTransaction when no txInstance is provided", async () => {
      const userId = "user-1";
      const updateData = { firstName: "Another Name" };

      await UsersService.updateUser({ userId, update: updateData });

      expect(dbSpies.runInTransactionSpy).toHaveBeenCalled();
    });

    it("should NOT call dbService.runInTransaction when a txInstance is provided", async () => {
      const userId = "user-2";
      const updateData = { firstName: "new-name" };

      await UsersService.updateUser({
        userId,
        update: updateData,
        txInstance: dbSpies.mockTx,
      });

      expect(dbSpies.runInTransactionSpy).not.toHaveBeenCalled();
    });
  });

  describe("generateReferralCode", () => {
    it("should return a string starting with 'DOJ'", () => {
      const code = UsersService.generateReferralCode();
      expect(typeof code).toBe("string");
      expect(code.startsWith("DOJ")).toBe(true);
    });

    it("should return a string of length 7", () => {
      const code = UsersService.generateReferralCode();
      expect(code.length).toBe(7);
    });

    it("should generate different codes on subsequent calls", () => {
      const code1 = UsersService.generateReferralCode();
      const code2 = UsersService.generateReferralCode();
      expect(code1).not.toEqual(code2);
    });
  });
});
