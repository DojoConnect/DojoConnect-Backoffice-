import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock, MockInstance } from "vitest";
import { createDrizzleDbSpies } from "../tests/spies/drizzle-db.spies.js";
import {DojosService} from "./dojos.service.js";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";

describe("Dojo Service", () => {
  let mockExecute: Mock;
  let logErrorSpy: MockInstance;

  beforeEach(() => {
    const dbServiceSpy = createDrizzleDbSpies();

    mockExecute = dbServiceSpy.mockExecute;

    logErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchDojoByTag", () => {
    it("should return a dojo object when the database finds a match", async () => {
      // Arrange: Mock the database response for a found dojo.
      const mockDojo = buildDojoMock({
        tag: "test-dojo",
      });
      mockExecute.mockResolvedValue([mockDojo]);

      // Act: Call the service function directly.
      const result = await DojosService.getOneDojoByTag("test-dojo");

      // Assert: Check that the service returned the correct data.
      expect(result).toEqual(mockDojo);
      expect(mockExecute).toHaveBeenCalled();
    });

    it("should return null when the database finds no match", async () => {
      // Arrange: Mock the database to return no results.
      mockExecute.mockResolvedValue([]); // Empty array signifies "not found"

      const result = await DojosService.getOneDojoByTag("non-existent-dojo");

      expect(result).toEqual(null);
    });
  });
});
