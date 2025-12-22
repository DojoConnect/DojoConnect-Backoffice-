import request from "supertest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock, MockInstance } from "vitest";

// Import the mock execute function so we can control its behavior in our tests.
import { buildDojoMock } from "../tests/factories/dojos.factory.js";
import { createDrizzleDbSpies } from "../tests/spies/drizzle-db.spies.js";
import app from "../app.js";

describe("Dojo Routes", () => {
  let mockExecute: Mock;

  beforeEach(() => {
    const dbServiceSpy = createDrizzleDbSpies();

    mockExecute = dbServiceSpy.mockExecute;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/dojos/slug/:slug", () => {
    it("should return a 200 status and the dojo data if the slug exists", async () => {
      // Arrange: Mock the database response for a found dojo
      const mockDojo = buildDojoMock({
        tag: "test-dojo",
      });

      mockExecute.mockResolvedValue([mockDojo as any]);

      // Act: Make the API request
      const response = await request(app).get("/api/dojos/slug/test-dojo");

      // Assert: Check the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: {
          ...mockDojo,
          trialEndsAt: mockDojo.trialEndsAt?.toISOString(),
        },
      });
      expect(mockExecute).toHaveBeenCalled();
    });

    it("should return a 404 status if the slug does not exist", async () => {
      // Arrange: Mock the database to return no results
      mockExecute.mockResolvedValue([] as any); // Empty array signifies "not found"

      // Act & Assert
      await request(app).get("/api/dojos/slug/non-existent-dojo").expect(404);
    });
  });
});
