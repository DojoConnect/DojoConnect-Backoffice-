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

  describe("fetchDojoByTag", () => {
    it("should return a dojo object when the database finds a match", async () => {
      // Arrange: Mock the database response for a found dojo.
      const mockDojo = buildDojoMock({
        tag: "test-dojo",
      });
      mockExecute.mockResolvedValue([mockDojo]);

      // Act: Call the service function directly.
      const result = await dojosService.getOneDojoByTag("test-dojo");

      // Assert: Check that the service returned the correct data.
      expect(result).toEqual(mockDojo);
      expect(mockExecute).toHaveBeenCalled();
    });

    it("should return null when the database finds no match", async () => {
      // Arrange: Mock the database to return no results.
      mockExecute.mockResolvedValue([]); // Empty array signifies "not found"

      const result = await dojosService.getOneDojoByTag("non-existent-dojo");

      expect(result).toEqual(null);
    });
  });
});
