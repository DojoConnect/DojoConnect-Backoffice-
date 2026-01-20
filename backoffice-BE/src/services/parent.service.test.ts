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

    vi.spyOn(UserRepository, "getUserProfileForInstructor");
    vi.spyOn(ClassRepository, "findById");
    

    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
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
    const parent = buildParentMock({ userId: currentUser.id });
    const studentData = {
      student: { id: "student-1", parentId: parent.id },
      user: buildUserMock(),
    };
    const enrollment = { classId: "class-1", studentId: "student-1", active: true };
    const classData = buildClassMock({ id: "class-1", instructorId: "instructor-1" });
    const instructorProfile = {
      firstName: "Sensei",
      lastName: "John",
      instructorId: "instructor-1",
      id: "instructor-1",
    };

    it("should return enrolled classes", async () => {
      getOneParentByUserIdSpy.mockResolvedValue(parent);
      getStudentsByParentIdSpy.mockResolvedValue([studentData]);
      fetchActiveEnrollmentsByStudentIdsSpy.mockResolvedValue([enrollment]);
      findClassesByIdsSpy.mockResolvedValue([classData]);
      getUserProfileByInstructorIdsSpy.mockResolvedValue([instructorProfile]);

      const result = await ParentService.getClassesEnrolledByChildren({ currentUser });

      expect(getOneParentByUserIdSpy).toHaveBeenCalledWith(currentUser.id, expect.anything());
      expect(getStudentsByParentIdSpy).toHaveBeenCalledWith(parent.id, expect.anything());
      expect(fetchActiveEnrollmentsByStudentIdsSpy).toHaveBeenCalledWith(
        ["student-1"],
        expect.anything(),
      );
      expect(findClassesByIdsSpy).toHaveBeenCalledWith(["class-1"], expect.anything());
      expect(getUserProfileByInstructorIdsSpy).toHaveBeenCalledWith(
        ["instructor-1"],
        expect.anything(),
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(classData.id);
      expect(result[0].instructor).toBeDefined();
      expect(result[0].schedules).toEqual([]);
    });

    it("should handle no enrollments", async () => {
      getOneParentByUserIdSpy.mockResolvedValue(parent);
      getStudentsByParentIdSpy.mockResolvedValue([studentData]);
      fetchActiveEnrollmentsByStudentIdsSpy.mockResolvedValue([]);

      const result = await ParentService.getClassesEnrolledByChildren({ currentUser });

      expect(result).toHaveLength(0);
    });

    it("should handle no students", async () => {
      getOneParentByUserIdSpy.mockResolvedValue(parent);
      getStudentsByParentIdSpy.mockResolvedValue([]);

      const result = await ParentService.getClassesEnrolledByChildren({ currentUser });

      expect(result).toHaveLength(0);
    });

    it("should handle no instructor", async () => {
      getOneParentByUserIdSpy.mockResolvedValue(parent);
      getStudentsByParentIdSpy.mockResolvedValue([studentData]);
      fetchActiveEnrollmentsByStudentIdsSpy.mockResolvedValue([enrollment]);

      const classNoInstructor = { ...classData, instructorId: null };
      findClassesByIdsSpy.mockResolvedValue([classNoInstructor]);
      getUserProfileByInstructorIdsSpy.mockResolvedValue([]);

      const result = await ParentService.getClassesEnrolledByChildren({ currentUser });

      expect(result[0].instructor).toBeNull();
    });

    it("should throw NotFoundException if parent not found", async () => {
      getOneParentByUserIdSpy.mockResolvedValue(null);
      await expect(ParentService.getClassesEnrolledByChildren({ currentUser })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
