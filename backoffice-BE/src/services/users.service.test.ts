import * as usersService from "./users.service";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies";
import { users } from "../db/schema";
import { buildUserMock } from "../tests/factories/user.factory";
import { eq } from "drizzle-orm";

describe("Users Service", () => {
    let mockExecute: jest.Mock;
    let mockSelect: jest.Mock;
    let mockFrom: jest.Mock;
    let mockLimit: jest.Mock;
    let dbSpies : DbServiceSpies;
    
      beforeEach(() => {
        dbSpies = createDrizzleDbSpies();
    
        mockExecute = dbSpies.mockExecute;
        mockSelect = dbSpies.mockSelect;
        mockFrom = dbSpies.mockFrom;
        mockLimit = dbSpies.mockLimit;
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

        const {passwordHash, ...userWithoutPassword} = mockUser;


        mockExecute.mockResolvedValue([mockUser]);

        const result = await  usersService.getOneUser(
          { whereClause: { id: 1 }, withPassword: false },
        );

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

        const result = await usersService.getOneUser(
          { whereClause: { id: 1 }, withPassword: true },
        );

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

        await usersService.getOneUser({ whereClause: { email: "test@example.com" } });

        expect(dbSpies.mockWhere).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(mockLimit).toHaveBeenCalledWith(1);
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
          `Error fetching dojo by Email: ${email}`,
          { err: testError }
        );
      });
})
})