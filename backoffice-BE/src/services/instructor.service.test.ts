import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { MockInstance } from "vitest";
import { InstructorService } from "./instructor.service.js";
import { InvitesRepository } from "../repositories/invites.repository.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { HttpException } from "../core/errors/HttpException.js";
import { ConflictException } from "../core/errors/ConflictException.js";
import { InstructorsRepository } from "../repositories/instructors.repository.js";
import { InstructorInviteStatus, Role } from "../constants/enums.js";
import { subDays } from "date-fns";
import { InstructorInviteDetailsDTO } from "../dtos/instructor.dtos.js";
import {
  createDrizzleDbSpies,
  DbServiceSpies,
} from "../tests/spies/drizzle-db.spies.js";
import {
  buildAcceptInviteDTOMock,
  buildInviteDetailsMock,
} from "../tests/factories/instructor.factory.js";
import { NotificationService } from "./notifications.service.js";
import { AuthService } from "./auth.service.js";
import { UsersService } from "./users.service.js";
import { MailerService } from "./mailer.service.js";
import { buildUserMock } from "../tests/factories/user.factory.js";

vi.mock("../utils/auth.utils.js", () => ({
  hashToken: (token) => `hashed-${token}`,
}));

describe("InstructorService", () => {
  const mockUser = buildUserMock();

  let getInviteDetailsSpy: MockInstance;
  let markAsExpiredSpy: MockInstance;
  let dbServiceSpies: DbServiceSpies;
  let getOneUserByIDSpy: MockInstance;

  beforeEach(() => {
    dbServiceSpies = createDrizzleDbSpies();
    getInviteDetailsSpy = vi.spyOn(InvitesRepository, "getInviteDetails");
    markAsExpiredSpy = vi
      .spyOn(InvitesRepository, "markInviteAsExpired")
      .mockResolvedValue();
    getOneUserByIDSpy = vi
      .spyOn(UsersService, "getOneUserByID")
      .mockResolvedValue(mockUser);
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

      expect(markAsExpiredSpy).toHaveBeenCalledWith(
        mockDetails.id,
        dbServiceSpies.mockTx
      );
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

  describe("notifyDojoOwnerOfResponse", () => {
    let notifyDojoOwnerOfInviteResponseSpy: MockInstance;
    let sendInviteResponseEmailSpy: MockInstance;

    beforeEach(() => {
      vi.clearAllMocks();

      notifyDojoOwnerOfInviteResponseSpy = vi
        .spyOn(NotificationService, "notifyDojoOwnerOfInviteResponse")
        .mockResolvedValue();
      sendInviteResponseEmailSpy = vi
        .spyOn(MailerService, "sendInviteResponseEmail")
        .mockResolvedValue();
    });

    it("should notify the dojo owner when an invite is accepted", async () => {
      const mockDetails = buildInviteDetailsMock();
      const dojoOwner = buildUserMock({ id: mockDetails.dojoOwnerId });
      getOneUserByIDSpy.mockResolvedValue(dojoOwner);

      await InstructorService.notifyDojoOwnerOfResponse({
        tx: dbServiceSpies.mockTx,
        invite: mockDetails,
        response: InstructorInviteStatus.Accepted,
      });

      expect(getOneUserByIDSpy).toHaveBeenCalledWith({
        userId: mockDetails.dojoOwnerId,
        txInstance: dbServiceSpies.mockTx,
      });
      expect(notifyDojoOwnerOfInviteResponseSpy).toHaveBeenCalledWith({
        user: dojoOwner,
        inviteDetails: mockDetails,
        status: InstructorInviteStatus.Accepted,
      });
      expect(sendInviteResponseEmailSpy).toHaveBeenCalledWith({
        dojoOwner,
        inviteDetails: mockDetails,
        response: InstructorInviteStatus.Accepted,
      });
    });

    it("should notify the dojo owner when an invite is declined", async () => {
      const mockDetails = buildInviteDetailsMock();
      const dojoOwner = buildUserMock({ id: mockDetails.dojoOwnerId });
      getOneUserByIDSpy.mockResolvedValue(dojoOwner);

      await InstructorService.notifyDojoOwnerOfResponse({
        tx: dbServiceSpies.mockTx,
        invite: mockDetails,
        response: InstructorInviteStatus.Declined,
      });

      expect(getOneUserByIDSpy).toHaveBeenCalledWith({
        userId: mockDetails.dojoOwnerId,
        txInstance: dbServiceSpies.mockTx,
      });
      expect(notifyDojoOwnerOfInviteResponseSpy).toHaveBeenCalledWith({
        user: dojoOwner,
        inviteDetails: mockDetails,
        status: InstructorInviteStatus.Declined,
      });
      expect(sendInviteResponseEmailSpy).toHaveBeenCalledWith({
        dojoOwner,
        inviteDetails: mockDetails,
        response: InstructorInviteStatus.Declined,
      });
    });

    it("should throw NotFoundException if dojo owner not found", async () => {
      const mockDetails = buildInviteDetailsMock();
      getOneUserByIDSpy.mockResolvedValueOnce(null);

      await expect(
        InstructorService.notifyDojoOwnerOfResponse({
          tx: dbServiceSpies.mockTx,
          invite: mockDetails,
          response: InstructorInviteStatus.Accepted,
        })
      ).rejects.toThrow(NotFoundException);

      expect(notifyDojoOwnerOfInviteResponseSpy).not.toHaveBeenCalled();
      expect(sendInviteResponseEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe("addInstructorToDojo", () => {
    let attachInstructorToDojoSpy: MockInstance;

    beforeEach(() => {
      attachInstructorToDojoSpy = vi
        .spyOn(InstructorsRepository, "attachInstructorToDojo")
        .mockResolvedValue();
    });

    it("should add an instructor to a dojo successfully", async () => {
      const instructor = buildUserMock({ role: Role.Instructor });
      const dojoId = "dojo-123";

      await InstructorService.addInstructorToDojo(instructor, dojoId);

      expect(attachInstructorToDojoSpy).toHaveBeenCalledWith(
        instructor.id,
        dojoId,
        dbServiceSpies.mockTx
      );
    });

    it("should throw ConflictException if the user is not an instructor", async () => {
      const user = buildUserMock({ role: Role.DojoAdmin });
      const dojoId = "dojo-123";

      await expect(
        InstructorService.addInstructorToDojo(user, dojoId)
      ).rejects.toThrow(new ConflictException("User is not an instructor"));

      expect(attachInstructorToDojoSpy).not.toHaveBeenCalled();
    });
  });

  describe("declineInvite", () => {
    let markAsRespondedSpy: MockInstance;
    let notifyDojoOwnerSpy: MockInstance;

    beforeEach(() => {
      markAsRespondedSpy = vi
        .spyOn(InvitesRepository, "markInviteAsResponded")
        .mockResolvedValue();

      notifyDojoOwnerSpy = vi
        .spyOn(InstructorService, "notifyDojoOwnerOfResponse")
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
      expect(markAsRespondedSpy).toHaveBeenCalledWith(
        mockDetails.id,
        InstructorInviteStatus.Declined,
        dbServiceSpies.mockTx
      );

      expect(notifyDojoOwnerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tx: dbServiceSpies.mockTx,
          invite: mockDetails,
          response: InstructorInviteStatus.Declined,
        })
      );
    });

    it("should throw NotFoundException for an invalid token", async () => {
      getInviteDetailsSpy.mockResolvedValue(null);

      await expect(
        InstructorService.declineInvite({ token: "invalid-token" })
      ).rejects.toThrow(new NotFoundException("Invite not found"));

      expect(markAsRespondedSpy).not.toHaveBeenCalled();
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

      expect(markAsRespondedSpy).not.toHaveBeenCalled();
    });
  });

  describe("acceptInvite", () => {
    let createUserSpy: MockInstance;
    let addInstructorToDojoSpy: MockInstance;
    let markAsRespondedSpy: MockInstance;
    let notifyDojoOwnerSpy: MockInstance;
    let sendInviteAcceptedNotificationSpy: MockInstance;
    let sendInviteAcceptedEmailSpy: MockInstance;

    const dto = buildAcceptInviteDTOMock({
      token: "valid-token",
      password: "password123",
    });

    beforeEach(() => {
      createUserSpy = vi
        .spyOn(AuthService, "createUser")
        .mockResolvedValue(mockUser);
      addInstructorToDojoSpy = vi
        .spyOn(InstructorService, "addInstructorToDojo")
        .mockResolvedValue();
      markAsRespondedSpy = vi
        .spyOn(InvitesRepository, "markInviteAsResponded")
        .mockResolvedValue();
      notifyDojoOwnerSpy = vi
        .spyOn(InstructorService, "notifyDojoOwnerOfResponse")
        .mockResolvedValue();
      sendInviteAcceptedNotificationSpy = vi
        .spyOn(NotificationService, "sendInviteAcceptedNotification")
        .mockResolvedValue();
      sendInviteAcceptedEmailSpy = vi
        .spyOn(MailerService, "sendInviteAcceptedEmail")
        .mockResolvedValue();
    });

    it("should accept a pending invite successfully", async () => {
      const mockDetails = buildInviteDetailsMock();
      getInviteDetailsSpy.mockResolvedValue(mockDetails);

      await InstructorService.acceptInvite(dto);

      expect(getInviteDetailsSpy).toHaveBeenCalledWith(
        "hashed-valid-token",
        dbServiceSpies.mockTx
      );
      expect(createUserSpy).toHaveBeenCalledWith({
        dto: {
          firstName: mockDetails.firstName,
          lastName: mockDetails.lastName,
          email: mockDetails.email,
          password: dto.password,
          username: mockDetails.email.split("@")[0],
        },
        role: Role.Instructor,
        tx: dbServiceSpies.mockTx,
      });
      expect(addInstructorToDojoSpy).toHaveBeenCalledWith(
        mockUser,
        mockDetails.dojoId,
        dbServiceSpies.mockTx
      );
      expect(markAsRespondedSpy).toHaveBeenCalledWith(
        mockDetails.id,
        InstructorInviteStatus.Accepted,
        dbServiceSpies.mockTx
      );
      expect(notifyDojoOwnerSpy).toHaveBeenCalledWith({
        tx: dbServiceSpies.mockTx,
        invite: mockDetails,
        response: InstructorInviteStatus.Accepted,
      });
      expect(sendInviteAcceptedNotificationSpy).toHaveBeenCalledWith(
        mockUser,
        mockDetails
      );
      expect(sendInviteAcceptedEmailSpy).toHaveBeenCalledWith({
        instructor: mockUser,
        inviteDetails: mockDetails,
      });
    });

    it("should throw NotFoundException if invite is not found", async () => {
      getInviteDetailsSpy.mockResolvedValue(null);

      await expect(InstructorService.acceptInvite(dto)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw ConflictException if invite is not pending", async () => {
      const mockDetails = buildInviteDetailsMock({
        status: InstructorInviteStatus.Declined,
      });
      getInviteDetailsSpy.mockResolvedValue(mockDetails);

      await expect(InstructorService.acceptInvite(dto)).rejects.toThrow(
        ConflictException
      );
    });

    it("should throw HttpException 410 if invite is expired", async () => {
      const mockDetails = buildInviteDetailsMock({
        expiresAt: subDays(new Date(), 1),
      });
      getInviteDetailsSpy.mockResolvedValue(mockDetails);

      await expect(InstructorService.acceptInvite(dto)).rejects.toThrow(
        HttpException
      );
      expect(markAsExpiredSpy).toHaveBeenCalledWith(
        mockDetails.id,
        dbServiceSpies.mockTx
      );
    });
  });
});
