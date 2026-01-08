import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock, MockInstance } from "vitest";
import { createDrizzleDbSpies } from "../tests/spies/drizzle-db.spies.js";
import { DojosService } from "./dojos.service.js";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import { UsersService } from "./users.service.js";
import { InstructorService } from "./instructor.service.js";
import { InvitesRepository } from "../repositories/invites.repository.js";
import { ClassService } from "./class.service.js";
import { MailerService } from "./mailer.service.js";
import * as assertions from "../utils/assertions.utils.js";
import { ConflictException } from "../core/errors/ConflictException.js";
import { ForbiddenException } from "../core/errors/ForbiddenException.js";
import { InstructorInviteStatus, Role } from "../constants/enums.js";
import {
  buildInstructorInviteMock,
  buildInstructorMock,
  buildInviteInstructorDtoMock,
} from "../tests/factories/instructor.factory.js";
import { InvitedInstructorDTO } from "../dtos/instructor.dtos.js";
import { InstructorsRepository } from "../repositories/instructors.repository.js";
import { DojoRepository } from "../repositories/dojo.repository.js";
import { buildClassMock } from "../tests/factories/class.factory.js";
import { ClassRepository } from "../repositories/class.repository.js";

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

  describe("createDojo", () => {
    let createDojoRepoSpy: MockInstance;
    let attachInstructorSpy: MockInstance;
    let getDojoByIdSpy: MockInstance;

    beforeEach(() => {
      createDojoRepoSpy = vi
        .spyOn(DojoRepository, "create")
        .mockResolvedValue("new-dojo-id");
      attachInstructorSpy = vi
        .spyOn(InstructorsRepository, "attachInstructorToDojo")
        .mockResolvedValue();
      getDojoByIdSpy = vi
        .spyOn(DojosService, "getOneDojoByID")
        .mockResolvedValue(buildDojoMock());
    });

    it("should create a dojo, attach the owner as an instructor, and return the dojo", async () => {
      const newDojoDto = buildDojoMock();

      const result = await DojosService.createDojo(newDojoDto);

      expect(createDojoRepoSpy).toHaveBeenCalledWith(
        newDojoDto,
        expect.anything()
      );
      expect(attachInstructorSpy).toHaveBeenCalledWith(
        newDojoDto.ownerUserId,
        "new-dojo-id",
        expect.anything()
      );
      expect(getDojoByIdSpy).toHaveBeenCalledWith(
        "new-dojo-id",
        expect.anything()
      );
      expect(result).toEqual(buildDojoMock());
    });
  });

  describe("fetchDojoByTag", () => {
    it("should return a dojo object when the database finds a match", async () => {
      const mockDojo = buildDojoMock({ tag: "test-dojo" });
      const getOneByTagSpy = vi
        .spyOn(DojoRepository, "getOneByTag")
        .mockResolvedValue(mockDojo);

      const result = await DojosService.getOneDojoByTag("test-dojo");

      expect(result).toEqual(mockDojo);
      expect(getOneByTagSpy).toHaveBeenCalled();
    });

    it("should return null when the database finds no match", async () => {
      const getOneByTagSpy = vi
        .spyOn(DojoRepository, "getOneByTag")
        .mockResolvedValue(null);
      const result = await DojosService.getOneDojoByTag("non-existent-dojo");

      expect(result).toEqual(null);
    });
  });

  describe("inviteInstructor", () => {
    const user = buildUserMock({ id: "user-1", role: Role.DojoAdmin });
    const dojo = buildDojoMock({ id: "dojo-1", ownerUserId: "user-1" });
    const dto = buildInviteInstructorDtoMock({
      email: "new.instructor@test.com",
      firstName: "New",
      lastName: "Instructor",
      classId: undefined,
    });

    let assertDojoOwnershipSpy: MockInstance;
    let getUserByEmailSpy: MockInstance;
    let getPendingInviteSpy: MockInstance;
    let createInviteSpy: MockInstance;
    let sendInviteEmailSpy: MockInstance;
    let findInstructorByUserIdSpy: MockInstance;
    let getOneClassByIdSpy: MockInstance;

    beforeEach(() => {
      assertDojoOwnershipSpy = vi
        .spyOn(assertions, "assertDojoOwnership")
        .mockImplementation(vi.fn());

      getUserByEmailSpy = vi
        .spyOn(UsersService, "getOneUserByEmail")
        .mockResolvedValue(null);

      getPendingInviteSpy = vi
        .spyOn(InvitesRepository, "getOnePendingInviteByEmailAndDojoId")
        .mockResolvedValue(null);
      createInviteSpy = vi
        .spyOn(InvitesRepository, "createInstructorInvite")
        .mockResolvedValue(1);
      sendInviteEmailSpy = vi
        .spyOn(MailerService, "sendInstructorInviteEmail")
        .mockResolvedValue(undefined);

      findInstructorByUserIdSpy = vi
        .spyOn(InstructorService, "findInstructorByUserId")
        .mockResolvedValue(null);

      getOneClassByIdSpy = vi
        .spyOn(ClassRepository, "findById")
        .mockResolvedValue(buildClassMock());
    });

    it("should successfully invite an instructor", async () => {
      await DojosService.inviteInstructor({ dojo, user, dto });

      expect(assertDojoOwnershipSpy).toHaveBeenCalledWith(dojo, user);
      expect(getUserByEmailSpy).toHaveBeenCalledWith({
        email: dto.email,
        txInstance: expect.anything(),
      });
      expect(getPendingInviteSpy).toHaveBeenCalledWith(
        dto.email,
        dojo.id,
        expect.anything()
      );
      expect(createInviteSpy).toHaveBeenCalled();
      expect(sendInviteEmailSpy).toHaveBeenCalledWith({
        dest: dto.email,
        firstName: dto.firstName,
        dojoName: dojo.name,
        token: expect.any(String),
      });
    });

    it("should throw a ForbiddenException if user is not the dojo owner", async () => {
      assertDojoOwnershipSpy.mockImplementation(() => {
        throw new ForbiddenException("Not owner");
      });

      await expect(
        DojosService.inviteInstructor({ dojo, user, dto })
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ConflictException if user with email already exists", async () => {
      getUserByEmailSpy.mockResolvedValue(buildUserMock());

      await expect(
        DojosService.inviteInstructor({ dojo, user, dto })
      ).rejects.toThrow(
        new ConflictException(`User with email ${dto.email} already exists`)
      );
    });

    it("should throw ConflictException if user is already an instructor for this dojo", async () => {
      const existingUser = buildUserMock({ id: "existing-user-1" });
      getUserByEmailSpy.mockResolvedValue(existingUser);
      findInstructorByUserIdSpy.mockResolvedValue(
        buildInstructorMock({
          id: "instructor-1",
          instructorUserId: existingUser.id,
          dojoId: dojo.id,
        })
      );

      await expect(
        DojosService.inviteInstructor({ dojo, user, dto })
      ).rejects.toThrow(
        new ConflictException(
          `User with email ${dto.email} is already an instructor for this dojo`
        )
      );
    });

    it("should throw ConflictException if user is already an instructor for another dojo", async () => {
      const existingUser = buildUserMock({ id: "existing-user-1" });
      getUserByEmailSpy.mockResolvedValue(existingUser);
      findInstructorByUserIdSpy.mockResolvedValue(
        buildInstructorMock({
          id: "instructor-1",
          instructorUserId: existingUser.id,
          dojoId: "another-dojo-id",
        })
      );

      await expect(
        DojosService.inviteInstructor({ dojo, user, dto })
      ).rejects.toThrow(
        new ConflictException(
          `User with email ${dto.email} is already an instructor for another dojo`
        )
      );
    });

    it("should throw ConflictException if an invite has already been sent", async () => {
      getPendingInviteSpy.mockResolvedValue(buildInstructorInviteMock());

      await expect(
        DojosService.inviteInstructor({ dojo, user, dto })
      ).rejects.toThrow(
        new ConflictException(
          `An invite has already been sent to ${dto.email} for this dojo`
        )
      );
    });

    it("should throw ConflictException if classId does not exist", async () => {
      const dtoWithClass = buildInviteInstructorDtoMock({
        ...dto,
        classId: "non-existent-class",
      });
      getOneClassByIdSpy.mockResolvedValue(null);

      await expect(
        DojosService.inviteInstructor({ dojo, user, dto: dtoWithClass })
      ).rejects.toThrow(
        new ConflictException(
          `Class with ID ${dtoWithClass.classId} does not exist`
        )
      );
    });

    it("should throw ConflictException if classId does not belong to the dojo", async () => {
      const dtoWithClass = buildInviteInstructorDtoMock({
        ...dto,
        classId: "class-from-another-dojo",
      });
      getOneClassByIdSpy.mockResolvedValueOnce({
        id: dtoWithClass.classId,
        dojoId: "another-dojo",
      } as any);

      await expect(
        DojosService.inviteInstructor({ dojo, user, dto: dtoWithClass })
      ).rejects.toThrow(
        new ConflictException(
          `Class with ID ${dtoWithClass.classId} does not belong to this dojo`
        )
      );
    });

    it("should successfully invite an instructor with a valid classId", async () => {
      const dtoWithClass = { ...dto, classId: "valid-class-id" };
      vi.mocked(ClassRepository.findById).mockResolvedValue({
        id: dtoWithClass.classId,
        dojoId: dojo.id,
      } as any);

      await DojosService.inviteInstructor({ dojo, user, dto: dtoWithClass });

      expect(InvitesRepository.createInstructorInvite).toHaveBeenCalledWith(
        expect.objectContaining({
          classId: dtoWithClass.classId,
        }),
        expect.anything()
      );
    });
  });

  describe("fetchInvitedInstructors", () => {
    let fetchInvitesSpy: MockInstance;

    beforeEach(() => {
      fetchInvitesSpy = vi
        .spyOn(InvitesRepository, "fetchDojoUnacceptedInstructorInvites")
        .mockResolvedValue([]);
    });

    it("should return an array of InvitedInstructorDTOs", async () => {
      const dojoId = "dojo-1";
      const mockInvites = [
        buildInstructorInviteMock({
          dojoId,
          status: InstructorInviteStatus.Pending,
        }),
        buildInstructorInviteMock({
          dojoId,
          status: InstructorInviteStatus.Accepted,
        }),
      ];
      fetchInvitesSpy.mockResolvedValue(mockInvites);

      const result = await DojosService.fetchInvitedInstructors({ dojoId });

      expect(
        InvitesRepository.fetchDojoUnacceptedInstructorInvites
      ).toHaveBeenCalledWith(dojoId, expect.anything());
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(InvitedInstructorDTO);
      expect(result[0].dojoId).toBe(dojoId);
      expect(result[1].status).toBe(InstructorInviteStatus.Accepted);

      // Check if DTO serialization works (omits sensitive fields)
      const jsonResult = result[0].toJSON();
      expect(jsonResult).not.toHaveProperty("tokenHash");
    });

    it("should return an empty array when no invites are found", async () => {
      const dojoId = "dojo-1";
      fetchInvitesSpy.mockResolvedValue([]);

      const result = await DojosService.fetchInvitedInstructors({ dojoId });

      expect(result).toEqual([]);
      expect(
        InvitesRepository.fetchDojoUnacceptedInstructorInvites
      ).toHaveBeenCalledWith(dojoId, expect.anything());
    });
  });

  describe("fetchInstructors", () => {
    let fetchInstructorsSpy: MockInstance;

    beforeEach(() => {
      fetchInstructorsSpy = vi
        .spyOn(InstructorsRepository, "fetchDojoInstructors")
        .mockResolvedValue([]);
    });

    it("should return an array of instructors", async () => {
      const dojoId = "dojo-1";
      const mockInstructors = [
        buildInstructorMock({ dojoId }),
        buildInstructorMock({ dojoId }),
      ];
      fetchInstructorsSpy.mockResolvedValue(mockInstructors);

      const result = await DojosService.fetchInstructors({ dojoId });

      expect(fetchInstructorsSpy).toHaveBeenCalledWith({
        dojoId,
        tx: expect.anything(),
      });
      expect(result).toEqual(mockInstructors);
    });

    it("should return an empty array if no instructors are found", async () => {
      const dojoId = "dojo-1";
      fetchInstructorsSpy.mockResolvedValue([]);

      const result = await DojosService.fetchInstructors({ dojoId });

      expect(result).toEqual([]);
      expect(fetchInstructorsSpy).toHaveBeenCalledWith({
        dojoId,
        tx: expect.anything(),
      });
    });

    it("should throw an error if the repository throws an error", async () => {
      const dojoId = "dojo-1";
      const testError = new Error("Database error");
      fetchInstructorsSpy.mockRejectedValue(testError);

      await expect(DojosService.fetchInstructors({ dojoId })).rejects.toThrow(
        testError
      );
    });
  });

  describe("fetchUserDojo", () => {
    let getDojoForOwnerSpy: MockInstance;
    let getDojoForInstructorSpy: MockInstance;

    beforeEach(() => {
      getDojoForOwnerSpy = vi
        .spyOn(DojoRepository, "getDojoForOwner")
        .mockResolvedValue(null);
      getDojoForInstructorSpy = vi
        .spyOn(DojoRepository, "getDojoForInstructor")
        .mockResolvedValue(null);
    });

    it("should call getDojoForOwner when user is a DojoAdmin", async () => {
      const user = buildUserMock({ role: Role.DojoAdmin });
      const dojo = buildDojoMock();
      getDojoForOwnerSpy.mockResolvedValue(dojo);

      const result = await DojosService.fetchUserDojo({ user });

      expect(getDojoForOwnerSpy).toHaveBeenCalledWith(
        user.id,
        expect.anything()
      );
      expect(getDojoForInstructorSpy).not.toHaveBeenCalled();
      expect(result).toEqual(dojo);
    });

    it("should call getDojoForInstructor when user is an Instructor", async () => {
      const user = buildUserMock({ role: Role.Instructor });
      const dojo = buildDojoMock();
      getDojoForInstructorSpy.mockResolvedValue(dojo);

      const result = await DojosService.fetchUserDojo({ user });

      expect(getDojoForInstructorSpy).toHaveBeenCalledWith(
        user.id,
        expect.anything()
      );
      expect(getDojoForOwnerSpy).not.toHaveBeenCalled();
      expect(result).toEqual(dojo);
    });

    it("should throw InternalServerErrorException for other roles", async () => {
      const user = buildUserMock({ role: Role.Parent });

      await expect(DojosService.fetchUserDojo({ user })).rejects.toThrow(
        "Code Path not implemented"
      );
    });

    it("should return null if no dojo is found for DojoAdmin", async () => {
      const user = buildUserMock({ role: Role.DojoAdmin });
      getDojoForOwnerSpy.mockResolvedValue(null);

      const result = await DojosService.fetchUserDojo({ user });

      expect(result).toBeNull();
    });

    it("should return null if no dojo is found for Instructor", async () => {
      const user = buildUserMock({ role: Role.Instructor });
      getDojoForInstructorSpy.mockResolvedValue(null);

      const result = await DojosService.fetchUserDojo({ user });

      expect(result).toBeNull();
    });
  });
});
