import { createDrizzleDbSpies } from "../tests/spies/drizzle-db.spies";
import * as dojosService from "./dojos.service";
import { buildDojoMock } from "../tests/factories/dojos.factory";
import { DojoRepository } from "../repositories/dojo.repository";

describe("Dojo Service", () => {
  let mockExecute: jest.Mock;
  let logErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    const dbServiceSpy = createDrizzleDbSpies();

    mockExecute = dbServiceSpy.mockExecute;

    logErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchDojoBySlug", () => {
    it("should return a dojo object when the database finds a match", async () => {
      // Arrange: Mock the database response for a found dojo.
      const mockDojo = buildDojoMock({
        tag: "test-dojo",
      });
      mockExecute.mockResolvedValue([mockDojo]);

      // Act: Call the service function directly.
      const result = await dojosService.getOneDojoBySlug("test-dojo");

      // Assert: Check that the service returned the correct data.
      expect(result).toEqual(mockDojo);
      expect(mockExecute).toHaveBeenCalled();
    });

    it("should return null when the database finds no match", async () => {
      // Arrange: Mock the database to return no results.
      mockExecute.mockResolvedValue([]); // Empty array signifies "not found"

      const result = await dojosService.getOneDojoBySlug("non-existent-dojo");

      expect(result).toEqual(null);
    });
  });

  describe("getOneDojoByUsername", () => {
    let getOneDojoSpy: jest.SpyInstance;

    beforeEach(() => {
      getOneDojoSpy = jest.spyOn(DojoRepository, "getOneByUserName");
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should call getOneDojo with correct whereClause and return user", async () => {
      const username = "user-123";
      const mockDojo = buildDojoMock({ username });

      getOneDojoSpy.mockResolvedValue(mockDojo);

      const result = await dojosService.getOneDojoByUserName({ username });

      expect(getOneDojoSpy).toHaveBeenCalledWith({
        username,
        tx: expect.anything(),
      });
      expect(result).toEqual(mockDojo);
    });

    it("should return null when no dojo is found", async () => {
      const username = "non-existent-username";

      getOneDojoSpy.mockResolvedValue(null);

      const result = await dojosService.getOneDojoByUserName({ username });

      expect(result).toBeNull();
    });

    it("should log error and throw when underlying getOneDojo throws", async () => {
      const username = "failure";

      const testError = new Error("DB failed");
      getOneDojoSpy.mockRejectedValueOnce(testError);

      logErrorSpy.mockImplementation(() => {});

      await expect(
        dojosService.getOneDojoByUserName({ username })
      ).rejects.toThrow("DB failed");

      expect(logErrorSpy).toHaveBeenCalledWith(
        `Error fetching dojo by Username: ${username}`,
        { err: testError }
      );
    });
  });
});
