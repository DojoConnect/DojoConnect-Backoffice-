import { createDrizzleDbSpies } from "../tests/spies/drizzle-db.spies";
import * as dojosService from "./dojos.service";
import { buildDojoMock } from "../tests/factories/dojos.factory";

describe("Dojo Service", () => {
  let mockExecute: jest.Mock;

  beforeEach(() => {
    const dbServiceSpy = createDrizzleDbSpies();

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
        dojoTag: "test-dojo",
      });
      mockExecute.mockResolvedValue([mockDojo]);

      // Act: Call the service function directly.
      const result = await dojosService.fetchDojoBySlug("test-dojo");

      // Assert: Check that the service returned the correct data.
      expect(result).toEqual(mockDojo);
      expect(mockExecute).toHaveBeenCalled();
    });

    it("should return null when the database finds no match", async () => {
      // Arrange: Mock the database to return no results.
      mockExecute.mockResolvedValue([]); // Empty array signifies "not found"

      const result = await dojosService.fetchDojoBySlug("non-existent-dojo");

      expect(result).toEqual(null);
    });
  });
});
