import { create } from "domain";
import { NotFoundException } from "../core/errors/NotFoundException";
import { createDbServiceSpies } from "../tests/spies/db.service.spies";
import * as dojosService from "./dojos.service";
import { buildDojoMock } from "../tests/spies/factories/dojos.factory";

describe("Dojo Service", () => {
  let getDbConnectionSpy: jest.SpyInstance;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    const dbServiceSpy = createDbServiceSpies();

    getDbConnectionSpy = dbServiceSpy.getDbConnectionSpy;
    mockExecute = dbServiceSpy.mockExecute;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchDojoBySlug", () => {
    it("should return a dojo object when the database finds a match", async () => {
      // Arrange: Mock the database response for a found dojo.
      const mockDojo = buildDojoMock({
        id: 1,
        name: "Test Dojo",
        dojo_tag: "test-dojo",
      });
      mockExecute.mockResolvedValue([[mockDojo]]);

      // Act: Call the service function directly.
      const result = await dojosService.fetchDojoBySlug("test-dojo");

      // Assert: Check that the service returned the correct data.
      expect(result).toEqual(mockDojo);
      expect(mockExecute).toHaveBeenCalledWith(expect.any(String), [
        "test-dojo",
      ]);
    });

    it("should throw a NotFoundException when the database finds no match", async () => {
      // Arrange: Mock the database to return no results.
      mockExecute.mockResolvedValue([[]]); // Empty array signifies "not found"

      // Act & Assert: Expect the function to throw the specific error.
      await expect(
        dojosService.fetchDojoBySlug("non-existent-dojo")
      ).rejects.toThrow(NotFoundException);
    });
  });
});
