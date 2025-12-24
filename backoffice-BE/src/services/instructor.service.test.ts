import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { MockInstance } from "vitest";
import { InstructorService } from "./instructor.service.js";
import { InvitesRepository } from "../repositories/invites.repository.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { HttpException } from "../core/errors/HttpException.js";
import { ConflictException } from "../core/errors/ConflictException.js";
import { InstructorInviteStatus } from "../constants/enums.js";
import { InstructorInviteDetails } from "../repositories/invites.repository.js";
import { faker } from "@faker-js/faker";
import { addDays, subDays } from "date-fns";
import { InstructorInviteDetailsDTO } from "../dtos/instructor.dtos.js";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies.js";

vi.mock("../utils/auth.utils.js", () => ({
  hashToken: (token) => `hashed-${token}`,
}));


const buildInviteDetailsMock = (
  overrides?: Partial<InstructorInviteDetails>
): InstructorInviteDetails => ({
  id: faker.string.uuid(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  status: InstructorInviteStatus.Pending,
  expiresAt: addDays(new Date(), 7),
  dojoName: "Test Dojo",
  className: null,
  invitedAt: new Date(),
  ...overrides,
});

describe("InstructorService", () => {
  let getInviteDetailsSpy: MockInstance;
  let markAsExpiredSpy: MockInstance;
  let dbServiceSpies: DbServiceSpies;

  beforeEach(() => {
    dbServiceSpies = createDrizzleDbSpies();
    getInviteDetailsSpy = vi.spyOn(InvitesRepository, "getInviteDetails");
    markAsExpiredSpy = vi
      .spyOn(InvitesRepository, "markInviteAsExpired")
      .mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getInviteDetails", () => {
    it("should return invite details for a valid token", async () => {
      const mockDetails = buildInviteDetailsMock();
      getInviteDetailsSpy.mockResolvedValue(mockDetails);

      const result = await InstructorService.getInviteDetails("valid-token");

      expect(getInviteDetailsSpy).toHaveBeenCalledWith(
        "hashed-valid-token",
        dbServiceSpies.mockTx
      );
      expect(result).toBeInstanceOf(InstructorInviteDetailsDTO);
      expect(result?.email).toBe(mockDetails.email);
      expect(markAsExpiredSpy).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException for an invalid token", async () => {
      getInviteDetailsSpy.mockResolvedValue(null);

      await expect(
        InstructorService.getInviteDetails("invalid-token")
      ).rejects.toThrow(new NotFoundException("Invite not found"));
    });

    it("should throw HttpException 410 for an expired token", async () => {
      const mockDetails = buildInviteDetailsMock({
        expiresAt: subDays(new Date(), 1),
      });
      getInviteDetailsSpy.mockResolvedValue(mockDetails);

      await expect(
        InstructorService.getInviteDetails("expired-token")
      ).rejects.toThrow(new HttpException(410, "Invite has expired"));

      expect(markAsExpiredSpy).toHaveBeenCalledWith(mockDetails.id, dbServiceSpies.mockTx);
    });

    it("should throw ConflictException if invite is not pending", async () => {
      const mockDetails = buildInviteDetailsMock({
        status: InstructorInviteStatus.Accepted,
      });
      getInviteDetailsSpy.mockResolvedValue(mockDetails);

      await expect(
        InstructorService.getInviteDetails("accepted-token")
      ).rejects.toThrow(
        new ConflictException(`Invite has already been ${mockDetails.status}`)
      );
    });
  });

  describe("declineInvite", () => {
    let markAsDeclinedSpy: MockInstance;

    beforeEach(() => {
      markAsDeclinedSpy = vi
        .spyOn(InvitesRepository, "markInviteAsDeclined")
        .mockResolvedValue();
    });

    it("should decline a pending invite successfully", async () => {
      const mockDetails = buildInviteDetailsMock();
      getInviteDetailsSpy.mockResolvedValue(mockDetails);

      await InstructorService.declineInvite({ token: "valid-token" });

      expect(getInviteDetailsSpy).toHaveBeenCalledWith(
        "hashed-valid-token",
        dbServiceSpies.mockTx
      );
      expect(markAsDeclinedSpy).toHaveBeenCalledWith(
        mockDetails.id,
        dbServiceSpies.mockTx
      );
    });

    it("should throw NotFoundException for an invalid token", async () => {
      getInviteDetailsSpy.mockResolvedValue(null);

      await expect(
        InstructorService.declineInvite({ token: "invalid-token" })
      ).rejects.toThrow(new NotFoundException("Invite not found"));

      expect(markAsDeclinedSpy).not.toHaveBeenCalled();
    });

    it("should throw ConflictException if invite is not pending", async () => {
      const mockDetails = buildInviteDetailsMock({
        status: InstructorInviteStatus.Accepted,
      });
      getInviteDetailsSpy.mockResolvedValue(mockDetails);

      await expect(
        InstructorService.declineInvite({ token: "accepted-token" })
      ).rejects.toThrow(
        new ConflictException(`Invite has already been ${mockDetails.status}`)
      );

      expect(markAsDeclinedSpy).not.toHaveBeenCalled();
    });
  });
});
