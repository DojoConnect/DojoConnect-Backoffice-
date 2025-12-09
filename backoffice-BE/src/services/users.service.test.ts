import * as usersService from "./users.service";
import * as stripeService from "./stripe.service";
import {
  createDrizzleDbSpies,
  DbServiceSpies,
} from "../tests/spies/drizzle-db.spies";
import { userCards, users } from "../db/schema";
import {
  buildNewUserMock,
  buildUserCardMock,
  buildUserMock,
} from "../tests/factories/user.factory";
import { eq } from "drizzle-orm";
import { NotFoundException } from "../core/errors";
import { buildStripeCardMock } from "../tests/factories/stripe.factory";

describe("Users Service", () => {
  let mockExecute: jest.Mock;
  let mockSelect: jest.Mock;
  let mockFrom: jest.Mock;
  let mockLimit: jest.Mock;
  let dbSpies: DbServiceSpies;
  let logErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    dbSpies = createDrizzleDbSpies();

    mockExecute = dbSpies.mockExecute;
    mockSelect = dbSpies.mockSelect;
    mockFrom = dbSpies.mockFrom;
    mockLimit = dbSpies.mockLimit;

    logErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getOneUser", () => {
    it("should return null when no user is found", async () => {
      mockExecute.mockResolvedValue([]);

      const result = await usersService.getOneUser({ whereClause: { id: 1 } });

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(users);
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(result).toBeNull();
    });

    it("should return user WITHOUT passwordHash when withPassword = false (default)", async () => {
      const mockUser = buildUserMock({
        id: "1",
        name: "John",
        passwordHash: "hashed_pw",
      });

      const { passwordHash, ...userWithoutPassword } = mockUser;

      mockExecute.mockResolvedValue([mockUser]);

      const result = await usersService.getOneUser({
        whereClause: { id: 1 },
        withPassword: false,
      });

      expect(result).toEqual(userWithoutPassword);
      expect(result).not.toHaveProperty("passwordHash");
    });

    it("returns user WITH passwordHash when withPassword = true", async () => {
      const mockUser = buildUserMock({
        id: "1",
        name: "John",
        passwordHash: "hashed_pw",
      });

      mockExecute.mockResolvedValue([mockUser]);

      const result = await usersService.getOneUser({
        whereClause: { id: 1 },
        withPassword: true,
      });

      expect(result).toEqual(mockUser);
      expect(result).toHaveProperty("passwordHash");
    });

    it("calls dbService.runInTransaction when no transaction instance is provided", async () => {
      const mockUser = buildUserMock({ id: "1", passwordHash: "hash" });
      mockExecute.mockResolvedValue([mockUser]);

      const result = await usersService.getOneUser({ whereClause: { id: 1 } });

      expect(dbSpies.runInTransactionSpy).toHaveBeenCalled();
    });

    it("correctly builds the SQL query with provided whereClause", async () => {
      const mockUser = buildUserMock({ id: "1", passwordHash: "pw" });
      mockExecute.mockResolvedValue([mockUser]);

      await usersService.getOneUser({
        whereClause: { email: "test@example.com" },
      });

      expect(dbSpies.mockWhere).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(mockLimit).toHaveBeenCalledWith(1);
    });
  });

  describe("getOneUserByID", () => {
    let getOneUserSpy: jest.SpyInstance;

    beforeEach(() => {
      getOneUserSpy = jest.spyOn(usersService, "getOneUser");
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should call getOneUser with correct whereClause and return user", async () => {
      const id = "123";
      const mockUser = buildUserMock({ id });

      getOneUserSpy.mockResolvedValue(mockUser);

      const result = await usersService.getOneUserByID({ userId: id });

      expect(getOneUserSpy).toHaveBeenCalledWith(
        { whereClause: eq(users.id, id) },
        expect.anything() // tx
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null when no user is found", async () => {
      const userId = "non-existent-id";

      getOneUserSpy.mockResolvedValue(null);

      const result = await usersService.getOneUserByID({ userId });

      expect(result).toBeNull();
    });

    it("should log error and throw when underlying getOneUser throws", async () => {
      const userId = "fail@example.com";

      const testError = new Error("DB failed");
      getOneUserSpy.mockRejectedValueOnce(testError);

      logErrorSpy.mockImplementation(() => {});

      await expect(usersService.getOneUserByID({ userId })).rejects.toThrow(
        "DB failed"
      );

      expect(logErrorSpy).toHaveBeenCalledWith(
        `Error fetching user by ID: ${userId}`,
        { err: testError }
      );
    });
  });

  describe("getOneUserByEmail", () => {
    let getOneUserSpy: jest.SpyInstance;

    beforeEach(() => {
      getOneUserSpy = jest.spyOn(usersService, "getOneUser");
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should call getOneUser with correct whereClause and return user", async () => {
      const email = "test@example.com";
      const mockUser = buildUserMock({ email });

      getOneUserSpy.mockResolvedValue(mockUser);

      const result = await usersService.getOneUserByEmail({ email });

      expect(getOneUserSpy).toHaveBeenCalledWith(
        { whereClause: eq(users.email, email), withPassword: false },
        expect.anything() // tx
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null when no user is found", async () => {
      const email = "missing@example.com";

      getOneUserSpy.mockResolvedValue(null);

      const result = await usersService.getOneUserByEmail({ email });

      expect(result).toBeNull();
    });

    it("should request password when withPassword = true", async () => {
      const email = "secure@example.com";
      const mockUser = buildUserMock({ email, passwordHash: "hash123" });

      getOneUserSpy.mockResolvedValue(mockUser);

      const result = await usersService.getOneUserByEmail({
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

      const result = await usersService.getOneUserByEmail({ email });

      expect(dbSpies.runInTransactionSpy).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it("should NOT call dbService.runInTransaction when txInstance is supplied", async () => {
      const email = "user@example.com";
      const mockUser = buildUserMock({ email });

      getOneUserSpy.mockResolvedValue(mockUser);

      const tx = dbSpies.mockTx;

      await usersService.getOneUserByEmail({
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

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(usersService.getOneUserByEmail({ email })).rejects.toThrow(
        "DB failed"
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        `Error fetching user by Email: ${email}`,
        { err: testError }
      );
    });
  });

  describe("getOneUserByUsername", () => {
    let getOneUserSpy: jest.SpyInstance;

    beforeEach(() => {
      getOneUserSpy = jest.spyOn(usersService, "getOneUser");
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should call getOneUser with correct whereClause and return user", async () => {
      const username = "user-123";
      const mockUser = buildUserMock({ username });

      getOneUserSpy.mockResolvedValue(mockUser);

      const result = await usersService.getOneUserByUserName({ username });

      expect(getOneUserSpy).toHaveBeenCalledWith(
        { whereClause: eq(users.username, username) },
        expect.anything() // tx
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null when no user is found", async () => {
      const username = "non-existent-username";

      getOneUserSpy.mockResolvedValue(null);

      const result = await usersService.getOneUserByUserName({ username });

      expect(result).toBeNull();
    });

    it("should log error and throw when underlying getOneUser throws", async () => {
      const username = "failure";

      const testError = new Error("DB failed");
      getOneUserSpy.mockRejectedValueOnce(testError);

      logErrorSpy.mockImplementation(() => {});

      await expect(
        usersService.getOneUserByUserName({ username })
      ).rejects.toThrow("DB failed");

      expect(logErrorSpy).toHaveBeenCalledWith(
        `Error fetching user by Username: ${username}`,
        { err: testError }
      );
    });
  });

  describe("fetchUserCards", () => {
    it("should return user cards for a given user ID", async () => {
      const userId = "user-1";
      const mockCards = [
        buildUserCardMock({ userId }),
        buildUserCardMock({ userId }),
      ];
      mockExecute.mockResolvedValue(mockCards);

      const result = await usersService.fetchUserCards(userId);

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

      const result = await usersService.fetchUserCards(userId);

      expect(result).toEqual([]);
    });

    it("should log error and re-throw when the database query fails", async () => {
      const userId = "user-1";
      const testError = new Error("DB query failed");
      mockExecute.mockRejectedValue(testError);

      await expect(usersService.fetchUserCards(userId)).rejects.toThrow(
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

      const result = await usersService.fetchUserCardsByPaymentMethod(
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

      const result = await usersService.fetchUserCardsByPaymentMethod(
        paymentMethodId
      );

      expect(result).toEqual([]);
    });

    it("should call dbService.runInTransaction when no txInstance is provided", async () => {
      const paymentMethodId = "pm_123";
      mockExecute.mockResolvedValue([]);

      await usersService.fetchUserCardsByPaymentMethod(paymentMethodId);

      expect(dbSpies.runInTransactionSpy).toHaveBeenCalled();
    });

    it("should NOT call dbService.runInTransaction when a txInstance is provided", async () => {
      const paymentMethodId = "pm_123";
      mockExecute.mockResolvedValue([]);

      await usersService.fetchUserCardsByPaymentMethod(
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
        usersService.fetchUserCardsByPaymentMethod(paymentMethodId)
      ).rejects.toThrow(testError);

      expect(logErrorSpy).toHaveBeenCalledWith(
        `Error fetching user cards by payment method: ${paymentMethodId}`,
        { err: testError }
      );
    });
  });

  describe("saveUser", () => {
    let getOneUserByIDSpy: jest.SpyInstance;

    beforeEach(() => {
      getOneUserByIDSpy = jest.spyOn(usersService, "getOneUserByID");
    });

    it("should insert a new user, fetch it, and return it", async () => {
      const newUser = buildNewUserMock({
        email: "new@user.com",
        username: "newuser",
      });
      const newUserId = "new-user-id-123";
      const mockSavedUser = buildUserMock({ id: newUserId, ...newUser });

      dbSpies.mockReturningId.mockResolvedValue([{ id: newUserId }]);

      getOneUserByIDSpy.mockResolvedValue(mockSavedUser);

      const result = await usersService.saveUser(newUser);

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
        username: "txuser",
      });
      const newUserId = "new-user-id-456";
      const mockSavedUser = buildUserMock({ id: newUserId, ...newUser });

      dbSpies.mockReturningId.mockResolvedValue([{ id: newUserId }]);
      getOneUserByIDSpy.mockResolvedValue(mockSavedUser);

      await usersService.saveUser(newUser, dbSpies.mockTx);

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
      const mockValues = jest.fn().mockResolvedValue(undefined);
      dbSpies.mockInsert.mockReturnValue({ values: mockValues });

      await usersService.saveUserCard(newUserCard);

      expect(dbSpies.runInTransactionSpy).toHaveBeenCalled();
      expect(dbSpies.mockInsert).toHaveBeenCalledWith(userCards);
      expect(mockValues).toHaveBeenCalledWith(newUserCard);
    });

    it("should use the provided transaction instance", async () => {
      await usersService.saveUserCard(buildUserCardMock(), dbSpies.mockTx);
      expect(dbSpies.runInTransactionSpy).not.toHaveBeenCalled();
    });
  });

  describe("setDefaultPaymentMethod", () => {
    let retrievePaymentMethodSpy: jest.SpyInstance;
    let fetchUserCardsByPaymentMethodSpy: jest.SpyInstance;
    let saveUserCardSpy: jest.SpyInstance;
    const mockUser = buildUserMock();
    const paymentMethodId = "pm_12345";
    const mockStripeCard = buildStripeCardMock({
      brand: "visa",
      last4: "4242",
      exp_month: 12,
      exp_year: 2030,
    });

    beforeEach(() => {
      retrievePaymentMethodSpy = jest
        .spyOn(stripeService, "retrievePaymentMethod")
        .mockResolvedValue({ card: mockStripeCard } as any);
      fetchUserCardsByPaymentMethodSpy = jest.spyOn(
        usersService,
        "fetchUserCardsByPaymentMethod"
      );
      saveUserCardSpy = jest
        .spyOn(usersService, "saveUserCard")
        .mockResolvedValue();
    });

    it("should throw NotFoundException if payment method has no card", async () => {
      retrievePaymentMethodSpy.mockResolvedValue({ card: null } as any);

      await expect(
        usersService.setDefaultPaymentMethod(mockUser, paymentMethodId)
      ).rejects.toThrow(NotFoundException);
      expect(logErrorSpy).not.toHaveBeenCalled();
    });

    it("should set all existing cards for user to isDefault: false", async () => {
      fetchUserCardsByPaymentMethodSpy.mockResolvedValue([]);

      await usersService.setDefaultPaymentMethod(mockUser, paymentMethodId);

      expect(dbSpies.mockUpdate).toHaveBeenCalledWith(userCards);
      expect(dbSpies.mockSet).toHaveBeenCalledWith({ isDefault: false });
      expect(dbSpies.mockWhere).toHaveBeenCalledWith(
        eq(userCards.userId, mockUser.id)
      );
    });

    it("should save a new card if it does not exist", async () => {
      fetchUserCardsByPaymentMethodSpy.mockResolvedValue([]);

      await usersService.setDefaultPaymentMethod(mockUser, paymentMethodId);

      expect(fetchUserCardsByPaymentMethodSpy).toHaveBeenCalledWith(
        paymentMethodId,
        expect.anything()
      );
      expect(saveUserCardSpy).toHaveBeenCalledWith({
        userId: mockUser.id,
        paymentMethodId: paymentMethodId,
        brand: mockStripeCard.brand,
        last4: mockStripeCard.last4,
        expMonth: mockStripeCard.exp_month,
        expYear: mockStripeCard.exp_year,
        isDefault: true,
      });
    });

    it("should update an existing card to be default if it exists", async () => {
      const existingCard = buildUserCardMock({
        paymentMethodId,
        isDefault: false,
      });
      fetchUserCardsByPaymentMethodSpy.mockResolvedValue([existingCard]);

      await usersService.setDefaultPaymentMethod(mockUser, paymentMethodId);

      expect(saveUserCardSpy).not.toHaveBeenCalled();
      // First call is to set all to false, second is to set the one to true
      expect(dbSpies.mockUpdate).toHaveBeenCalledTimes(2);
      expect(dbSpies.mockSet).toHaveBeenLastCalledWith({ isDefault: true });
      expect(dbSpies.mockWhere).toHaveBeenLastCalledWith(
        eq(userCards.paymentMethodId, paymentMethodId)
      );
    });

    it("should use a provided transaction instance", async () => {
      fetchUserCardsByPaymentMethodSpy.mockResolvedValue([]);

      await usersService.setDefaultPaymentMethod(
        mockUser,
        paymentMethodId,
        dbSpies.mockTx
      );

      expect(dbSpies.runInTransactionSpy).not.toHaveBeenCalled();
      expect(fetchUserCardsByPaymentMethodSpy).toHaveBeenCalledWith(
        paymentMethodId,
        dbSpies.mockTx
      );
    });
  });

  describe("generateReferralCode", () => {
    it("should return a string starting with 'DOJ'", () => {
      const code = usersService.generateReferralCode();
      expect(typeof code).toBe("string");
      expect(code.startsWith("DOJ")).toBe(true);
    });

    it("should return a string of length 7", () => {
      const code = usersService.generateReferralCode();
      expect(code.length).toBe(7);
    });

    it("should generate different codes on subsequent calls", () => {
      const code1 = usersService.generateReferralCode();
      const code2 = usersService.generateReferralCode();
      expect(code1).not.toEqual(code2);
    });
  });
});
