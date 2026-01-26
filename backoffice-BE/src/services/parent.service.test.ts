import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from "vitest";
import { ParentService } from "./parent.service.js";
import { ParentRepository } from "../repositories/parent.repository.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { ClassEnrollmentRepository } from "../repositories/enrollment.repository.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UsersService } from "./users.service.js";
import { AuthService } from "./auth.service.js";
import { MailerService } from "./mailer.service.js";
import { NotificationService } from "./notifications.service.js";

import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import { buildParentMock } from "../tests/factories/parent.factory.js";
import { buildClassMock } from "../tests/factories/class.factory.js";
import { ConflictException, NotFoundException } from "../core/errors/index.js";
import { Role } from "../constants/enums.js";
import { AddChildDTO } from "../dtos/parent.dtos.js";
import { buildStudentMock } from "../tests/factories/student.factory.js";
import { buildInstructorUserDetailsMock } from "../tests/factories/instructor.factory.js";
import { ClassDTO } from "../dtos/class.dtos.js";
import { ClassService } from "./class.service.js";

describe("Parent Service", () => {
  let dbSpies: DbServiceSpies;
  let logSpy: MockInstance;

  // Spies
  let getOneUserByEmailSpy: MockInstance;
  let getOneParentByUserIdSpy: MockInstance;
  let createUserSpy: MockInstance;
  let createStudentSpy: MockInstance;
  let sendChildAddedEmailToParentSpy: MockInstance;
  let sendChildWelcomeEmailSpy: MockInstance;
  let sendChildAddedNotificationSpy: MockInstance;
  let sendWelcomeNotificationToChildSpy: MockInstance;

  let getStudentsByParentIdSpy: MockInstance;
  let getStudentsAndUserByParentIdSpy: MockInstance;

  let fetchActiveEnrollmentsByStudentIdsSpy: MockInstance;

  let findClassesByIdsSpy: MockInstance;

  let getUserProfileByInstructorIdsSpy: MockInstance;
  let getParentClassesSpy: MockInstance;
  let fetchClassesByStudentIdSpy: MockInstance;
  let mapStudentClassesToDTOSpy: MockInstance;

  beforeEach(() => {
    dbSpies = createDrizzleDbSpies();

    getOneUserByEmailSpy = vi.spyOn(UsersService, "getOneUserByEmail");
    getOneParentByUserIdSpy = vi.spyOn(ParentRepository, "getOneParentByUserId");
    createUserSpy = vi.spyOn(AuthService, "createUser");
    createStudentSpy = vi.spyOn(StudentRepository, "create");

    sendChildAddedEmailToParentSpy = vi
      .spyOn(MailerService, "sendChildAddedEmailToParent")
      .mockResolvedValue();
    sendChildWelcomeEmailSpy = vi.spyOn(MailerService, "sendChildWelcomeEmail").mockResolvedValue();
    sendChildAddedNotificationSpy = vi
      .spyOn(NotificationService, "sendChildAddedNotification")
      .mockResolvedValue();
    sendWelcomeNotificationToChildSpy = vi
      .spyOn(NotificationService, "sendWelcomeNotificationToChild")
      .mockResolvedValue();

    getStudentsByParentIdSpy = vi.spyOn(StudentRepository, "getStudentsByParentId");
    getStudentsAndUserByParentIdSpy = vi.spyOn(StudentRepository, "getStudentsAndUserByParentId");

    // fetchEnrollmentsByStudentIdSpy = vi.spyOn(ClassEnrollmentRepository, "fetchEnrollmentsByStudentId"); // Removed as method no longer exists
    fetchActiveEnrollmentsByStudentIdsSpy = vi.spyOn(
      ClassEnrollmentRepository,
      "fetchActiveEnrollmentsByStudentIds",
    );

    getUserProfileByInstructorIdsSpy = vi.spyOn(UserRepository, "getUserProfileByInstructorIds");
    findClassesByIdsSpy = vi.spyOn(ClassRepository, "findClassesByIds");

    getParentClassesSpy = vi.spyOn(ClassService, "getParentClasses");
    fetchClassesByStudentIdSpy = vi.spyOn(ClassService, "fetchClassesByStudentId");
    mapStudentClassesToDTOSpy = vi.spyOn(ParentService, "mapStudentClassesToDTO");

    vi.spyOn(UserRepository, "getUserProfileForInstructor");
    vi.spyOn(ClassRepository, "findById");
    

    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("addChild", () => {
    const parentUser = buildUserMock({ role: Role.Parent });
    const parent = buildParentMock({ userId: parentUser.id });
    const dto: AddChildDTO = {
      firstName: "Kid",
      lastName: "Doe",
      email: "kid@test.com",
      dob: new Date("2015-01-01"),
      experience: "Beginner" as any,
    };

    it("should successfully add a child", async () => {
      getOneUserByEmailSpy.mockResolvedValue(null);
      getOneParentByUserIdSpy.mockResolvedValue(parent);

      const childUser = buildUserMock({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: Role.Child,
      });
      createUserSpy.mockResolvedValue(childUser);
      createStudentSpy.mockResolvedValue("student-id");

      const result = await ParentService.addChild({ parentUser, dto });

      expect(getOneUserByEmailSpy).toHaveBeenCalled();
      expect(getOneParentByUserIdSpy).toHaveBeenCalledWith(parentUser.id, expect.anything());
      expect(createUserSpy).toHaveBeenCalled();
      expect(createStudentSpy).toHaveBeenCalled();
      expect(sendChildAddedEmailToParentSpy).toHaveBeenCalled();
      expect(result.studentUserId).toBe(childUser.id);
    });

    it("should throw ConflictException if email exists", async () => {
      getOneUserByEmailSpy.mockResolvedValue(buildUserMock());
      await expect(ParentService.addChild({ parentUser, dto })).rejects.toThrow(ConflictException);
    });

    it("should throw NotFoundException if parent not found", async () => {
      getOneUserByEmailSpy.mockResolvedValue(null);
      getOneParentByUserIdSpy.mockResolvedValue(null);
      await expect(ParentService.addChild({ parentUser, dto })).rejects.toThrow(NotFoundException);
    });
  });

  describe("getChildren", () => {
    const currentUser = buildUserMock({ role: Role.Parent });
    const student = {
      student: {
        id: "student-id",
        parentId: "parent-id",
        studentUserId: "child-user-id",
        experienceLevel: "Beginner",
      },
      user: buildUserMock({ id: "child-user-id" }),
    };

    it("should return list of children", async () => {
      const mockParent = buildParentMock({ userId: currentUser.id });
      getOneParentByUserIdSpy.mockResolvedValue(mockParent);
      getStudentsAndUserByParentIdSpy.mockResolvedValue([student]);

      const result = await ParentService.getChildren({ currentUser });

      expect(getStudentsAndUserByParentIdSpy).toHaveBeenCalledWith(
        mockParent.id,
        expect.anything(),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(student.student.id);
    });
  });

  describe("getOneParentByUserId", () => {
    it("should return parent", async () => {
      const parent = buildParentMock();
      getOneParentByUserIdSpy.mockResolvedValue(parent);

      const result = await ParentService.getOneParentByUserId(parent.userId);

      expect(result).toEqual(parent);
    });
  });

  describe("getClassesEnrolledByChildren", () => {
    const currentUser = buildUserMock({ role: Role.Parent });
    const classData = buildClassMock({ id: "class-1", instructorId: "instructor-1" });
    const classDto = new ClassDTO({ ...classData, instructor: null, schedules: [] });

    it("should fetch parent classes and map them to DTOs", async () => {
      getParentClassesSpy.mockResolvedValue([classData]);
      mapStudentClassesToDTOSpy.mockResolvedValue([classDto]);

      const result = await ParentService.getClassesEnrolledByChildren({ currentUser });

      expect(getParentClassesSpy).toHaveBeenCalledWith(currentUser, expect.anything());
      expect(mapStudentClassesToDTOSpy).toHaveBeenCalledWith([classData], expect.anything());
      expect(result).toEqual([classDto]);
    });
  });

  describe("getClassesEnrolledByChild", () => {
    const currentUser = buildUserMock({ role: Role.Parent });
    const parent = buildParentMock({ userId: currentUser.id });
    const childId = "child-1";
    const student = buildStudentMock({ id: childId, parentId: parent.id });
    const classData = buildClassMock({ id: "class-1", instructorId: "instructor-1" });
    const classDto = new ClassDTO({ ...classData, instructor: null, schedules: [] });

    let getStudentByIdSpy: MockInstance;

    beforeEach(() => {
      getStudentByIdSpy = vi.spyOn(StudentRepository, "findOneById");
    });

    it("should fetch child classes and map them to DTOs", async () => {
      getOneParentByUserIdSpy.mockResolvedValue(parent);
      getStudentByIdSpy.mockResolvedValue(student);
      fetchClassesByStudentIdSpy.mockResolvedValue([classData]);
      mapStudentClassesToDTOSpy.mockResolvedValue([classDto]);

      const result = await ParentService.getClassesEnrolledByChild({ currentUser, childId });

      expect(getOneParentByUserIdSpy).toHaveBeenCalledWith(currentUser.id, expect.anything());
      expect(getStudentByIdSpy).toHaveBeenCalledWith(childId, expect.anything());
      expect(fetchClassesByStudentIdSpy).toHaveBeenCalledWith(childId, expect.anything());
      expect(mapStudentClassesToDTOSpy).toHaveBeenCalledWith([classData], expect.anything());
      expect(result).toEqual([classDto]);
    });

    it("should throw NotFoundException if parent not found", async () => {
      getOneParentByUserIdSpy.mockResolvedValue(null);

      await expect(ParentService.getClassesEnrolledByChild({ currentUser, childId })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if child not found or doesn't belong to parent", async () => {
      getOneParentByUserIdSpy.mockResolvedValue(parent);
      getStudentByIdSpy.mockResolvedValue(
        buildStudentMock({
          id: childId,
          parentId: "other-parent",
        }),
      );

      await expect(ParentService.getClassesEnrolledByChild({ currentUser, childId })).rejects.toThrow(
        new NotFoundException("Child not found for this parent"),
      );
    });
  });

  describe("mapStudentClassesToDTO", () => {
    const classData = buildClassMock({ id: "class-1", instructorId: "instructor-1" });
    const instructorProfile = buildInstructorUserDetailsMock({
      firstName: "Sensei",
      lastName: "John",
      instructorId: "instructor-1",
      id: "instructor-user-1",
    });

    it("should map classes to DTOs and include instructor details", async () => {
      getUserProfileByInstructorIdsSpy.mockResolvedValue([instructorProfile]);

      const result = await ParentService.mapStudentClassesToDTO([classData], {} as any);

      expect(getUserProfileByInstructorIdsSpy).toHaveBeenCalledWith(["instructor-1"], expect.anything());
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ClassDTO);
      expect(result[0].instructor?.id).toBe("instructor-user-1");
    });

    it("should map classes to DTOs and handle null instructor ids", async () => {
      const classNoInstructor = buildClassMock({ id: "class-2", instructorId: null });
      getUserProfileByInstructorIdsSpy.mockResolvedValue([]);

      const result = await ParentService.mapStudentClassesToDTO([classNoInstructor], {} as any);

      expect(getUserProfileByInstructorIdsSpy).toHaveBeenCalledWith([], expect.anything());
      expect(result).toHaveLength(1);
      expect(result[0].instructor).toBeNull();
    });
  });
});
