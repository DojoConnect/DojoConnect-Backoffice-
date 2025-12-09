import * as usersService from "./users.service";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies";
import { users } from "../db/schema";
import { buildUserMock } from "../tests/factories/user.factory";

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

})