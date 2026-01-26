import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock, MockInstance } from "vitest";

import { UsersService } from "./users.service.js";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies.js";
import { userCards, users } from "../db/schema.js";
import {
  buildNewUserMock,
  buildUpdateProfileDtoMock,
  buildUserCardMock,
  buildUserMock,
} from "../tests/factories/user.factory.js";
import { eq } from "drizzle-orm";
import { DojosService } from "./dojos.service.js";
import { InstructorService } from "./instructor.service.js";
import { ParentService } from "./parent.service.js";
import { StudentService } from "./student.service.js";
import { Role } from "../constants/enums.js";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";
import { buildInstructorMock } from "../tests/factories/instructor.factory.js";
import { buildParentMock } from "../tests/factories/parent.factory.js";
import { buildStudentMock } from "../tests/factories/student.factory.js";
import {
  DojoAdminUserDTO,
  InstructorUserDTO,
  ParentUserDTO,
  StudentUserDTO,
  UserDTO,
} from "../dtos/user.dtos.js";
import { UnauthorizedException } from "../core/errors/UnauthorizedException.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";
import { ConflictException } from "../core/errors/ConflictException.js";

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
        expect.anything(), // tx
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

      await expect(UsersService.getOneUserByID({ userId })).rejects.toThrow("DB failed");

      expect(logErrorSpy).toHaveBeenCalledWith(`Error fetching user by ID: ${userId}`, {
        err: testError,
      });
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
        expect.anything(), // tx
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
        expect.anything(),
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

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(UsersService.getOneUserByEmail({ email })).rejects.toThrow("DB failed");

      expect(consoleSpy).toHaveBeenCalledWith(`Error fetching user by Email: ${email}`, {
        err: testError,
      });
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
        expect.anything(),
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

      await expect(UsersService.getOneUserByUserName({ username })).rejects.toThrow("DB failed");

      expect(logErrorSpy).toHaveBeenCalledWith(`Error fetching dojo by Username: ${username}`, {
        err: testError,
      });
    });
  });

  describe("fetchUserCards", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return user cards for a given user ID", async () => {
      const userId = "user-1";
      const mockCards = [buildUserCardMock({ userId }), buildUserCardMock({ userId })];
      mockExecute.mockResolvedValue(mockCards);

      const result = await UsersService.fetchUserCards(userId);

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(userCards);
      expect(dbSpies.mockWhere).toHaveBeenCalledWith(eq(userCards.userId, userId));
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

      await expect(UsersService.fetchUserCards(userId)).rejects.toThrow(testError);

      expect(logErrorSpy).toHaveBeenCalledWith(`Error fetching user cards for user ID: ${userId}`, {
        err: testError,
      });
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

      const result = await UsersService.fetchUserCardsByPaymentMethod(paymentMethodId);

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(userCards);
      expect(dbSpies.mockWhere).toHaveBeenCalledWith(
        eq(userCards.paymentMethodId, paymentMethodId),
      );
      expect(result).toEqual(mockCards);
    });

    it("should return an empty array if no cards are found", async () => {
      const paymentMethodId = "pm_not_found";
      mockExecute.mockResolvedValue([]);

      const result = await UsersService.fetchUserCardsByPaymentMethod(paymentMethodId);

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

      await UsersService.fetchUserCardsByPaymentMethod(paymentMethodId, dbSpies.mockTx);

      expect(dbSpies.runInTransactionSpy).not.toHaveBeenCalled();
    });

    it("should log error and re-throw when the database query fails", async () => {
      const paymentMethodId = "pm_fail";
      const testError = new Error("DB query failed");
      mockExecute.mockRejectedValue(testError);

      await expect(UsersService.fetchUserCardsByPaymentMethod(paymentMethodId)).rejects.toThrow(
        testError,
      );

      expect(logErrorSpy).toHaveBeenCalledWith(
        `Error fetching user cards by payment method: ${paymentMethodId}`,
        { err: testError },
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

  describe("getDojoAdminUserDTO", () => {
    it("should throw UnauthorizedException if user role is not DojoAdmin", async () => {
      const user = buildUserMock({ role: Role.Instructor });
      await expect(UsersService.getDojoAdminUserDTO(user)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw NotFoundException if dojo is not found", async () => {
      const user = buildUserMock({ role: Role.DojoAdmin });
      vi.spyOn(DojosService, "fetchUserDojo").mockResolvedValue(null);

      await expect(UsersService.getDojoAdminUserDTO(user)).rejects.toThrow(NotFoundException);
    });

    it("should return DojoAdminUserDTO when everything is correct", async () => {
      const user = buildUserMock({ role: Role.DojoAdmin });
      const dojo = buildDojoMock();
      vi.spyOn(DojosService, "fetchUserDojo").mockResolvedValue(dojo);

      const result = await UsersService.getDojoAdminUserDTO(user);

      expect(result).toBeInstanceOf(DojoAdminUserDTO);
      expect(result.id).toBe(user.id);
      expect(result.dojo.id).toBe(dojo.id);
    });
  });

  describe("getInstructorUserDto", () => {
    it("should throw UnauthorizedException if user role is not Instructor", async () => {
      const user = buildUserMock({ role: Role.Parent });
      await expect(UsersService.getInstructorUserDto(user)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw NotFoundException if instructor is not found", async () => {
      const user = buildUserMock({ role: Role.Instructor });
      vi.spyOn(InstructorService, "findInstructorByUserId").mockResolvedValue(null);

      await expect(UsersService.getInstructorUserDto(user)).rejects.toThrow(NotFoundException);
    });

    it("should return InstructorUserDTO when everything is correct", async () => {
      const user = buildUserMock({ role: Role.Instructor });
      const instructor = buildInstructorMock();
      vi.spyOn(InstructorService, "findInstructorByUserId").mockResolvedValue(instructor);

      const result = await UsersService.getInstructorUserDto(user);

      expect(result).toBeInstanceOf(InstructorUserDTO);
      expect(result.id).toBe(user.id);
      expect(result.instructor.id).toBe(instructor.id);
    });
  });

  describe("getParentUserDto", () => {
    it("should throw UnauthorizedException if user role is not Parent", async () => {
      const user = buildUserMock({ role: Role.Instructor });
      await expect(UsersService.getParentUserDto(user)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw NotFoundException if parent is not found", async () => {
      const user = buildUserMock({ role: Role.Parent });
      vi.spyOn(ParentService, "getOneParentByUserId").mockResolvedValue(null);

      await expect(UsersService.getParentUserDto(user)).rejects.toThrow(NotFoundException);
    });

    it("should return ParentUserDTO when everything is correct", async () => {
      const user = buildUserMock({ role: Role.Parent });
      const parent = buildParentMock();
      vi.spyOn(ParentService, "getOneParentByUserId").mockResolvedValue(parent);

      const result = await UsersService.getParentUserDto(user);

      expect(result).toBeInstanceOf(ParentUserDTO);
      expect(result.id).toBe(user.id);
      expect(result.parent.id).toBe(parent.id);
    });
  });

  describe("getStudentUserDto", () => {
    it("should throw UnauthorizedException if user role is not Child", async () => {
      const user = buildUserMock({ role: Role.Parent });
      await expect(UsersService.getStudentUserDto(user)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw NotFoundException if student is not found", async () => {
      const user = buildUserMock({ role: Role.Child });
      vi.spyOn(StudentService, "findStudentByUserId").mockResolvedValue(null);

      await expect(UsersService.getStudentUserDto(user)).rejects.toThrow(NotFoundException);
    });

    it("should return StudentUserDTO when everything is correct", async () => {
      const user = buildUserMock({ role: Role.Child });
      const student = buildStudentMock();
      vi.spyOn(StudentService, "findStudentByUserId").mockResolvedValue(student);

      const result = await UsersService.getStudentUserDto(user);

      expect(result).toBeInstanceOf(StudentUserDTO);
      expect(result.id).toBe(user.id);
      expect(result.student.id).toBe(student.id);
    });
  });

  describe("getUserDTO", () => {
    it("should call getDojoAdminUserDTO for DojoAdmin role", async () => {
      const user = buildUserMock({ role: Role.DojoAdmin });
      const spy = vi.spyOn(UsersService, "getDojoAdminUserDTO").mockResolvedValue({} as any);

      await UsersService.getUserDTO(user);

      expect(spy).toHaveBeenCalledWith(user, expect.anything());
    });

    it("should call getInstructorUserDto for Instructor role", async () => {
      const user = buildUserMock({ role: Role.Instructor });
      const spy = vi.spyOn(UsersService, "getInstructorUserDto").mockResolvedValue({} as any);

      await UsersService.getUserDTO(user);

      expect(spy).toHaveBeenCalledWith(user, expect.anything());
    });

    it("should call getParentUserDto for Parent role", async () => {
      const user = buildUserMock({ role: Role.Parent });
      const spy = vi.spyOn(UsersService, "getParentUserDto").mockResolvedValue({} as any);

      await UsersService.getUserDTO(user);

      expect(spy).toHaveBeenCalledWith(user, expect.anything());
    });

    it("should call getStudentUserDto for Child role", async () => {
      const user = buildUserMock({ role: Role.Child });
      const spy = vi.spyOn(UsersService, "getStudentUserDto").mockResolvedValue({} as any);

      await UsersService.getUserDTO(user);

      expect(spy).toHaveBeenCalledWith(user, expect.anything());
    });

    it("should throw InternalServerErrorException for unknown role", async () => {
      const user = buildUserMock({ role: "ADMIN_OWNER" as any });
      await expect(UsersService.getUserDTO(user)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("updateProfile", () => {
    let getOneUserSpy: MockInstance;
    let updateUserSpy: MockInstance;
    let getOneUserByIDSpy: MockInstance;

    beforeEach(() => {
      getOneUserSpy = vi.spyOn(UsersService, "getOneUser");
      updateUserSpy = vi.spyOn(UsersService, "updateUser").mockResolvedValue(undefined);
      getOneUserByIDSpy = vi.spyOn(UsersService, "getOneUserByID");
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should throw ConflictException if username is already taken by another user", async () => {
      const userId = "user-1";
      const update = buildUpdateProfileDtoMock({ username: "taken-username" });
      const existingUser = buildUserMock({ id: "user-2", username: "taken-username" });

      getOneUserSpy.mockResolvedValue(existingUser);

      await expect(UsersService.updateProfile(userId, update)).rejects.toThrow(ConflictException);
      expect(getOneUserSpy).toHaveBeenCalled();
      expect(updateUserSpy).not.toHaveBeenCalled();
    });

    it("should update profile successfully when username is available", async () => {
      const userId = "user-1";
      const update = buildUpdateProfileDtoMock({ username: "new-username", firstName: "New" });
      const updatedUser = buildUserMock({ id: userId, ...update });

      getOneUserSpy.mockResolvedValue(null); // No other user with this username
      getOneUserByIDSpy.mockResolvedValue(updatedUser);

      const result = await UsersService.updateProfile(userId, update);

      expect(updateUserSpy).toHaveBeenCalledWith({ userId, update, txInstance: expect.anything() });
      expect(result).toBeInstanceOf(UserDTO);
      expect(result.username).toBe("new-username");
    });

    it("should throw NotFoundException if user is not found after update", async () => {
      const userId = "user-1";
      const update = buildUpdateProfileDtoMock({ firstName: "Ghost" });

      getOneUserByIDSpy.mockResolvedValue(null);

      await expect(UsersService.updateProfile(userId, update)).rejects.toThrow(NotFoundException);
    });
  });
});
