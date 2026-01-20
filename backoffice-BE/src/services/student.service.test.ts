import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from "vitest";
import { StudentService } from "./student.service.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { ClassEnrollmentRepository } from "../repositories/enrollment.repository.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import { buildClassMock } from "../tests/factories/class.factory.js";
import { buildStudentMock } from "../tests/factories/student.factory.js";
import { buildEnrollmentMock } from "../tests/factories/enrollment.factory.js";
import { NotFoundException } from "../core/errors/index.js";
import { Role } from "../constants/enums.js";

describe("Student Service", () => {
  let dbSpies: DbServiceSpies;

  let findOneByUserIdSpy: MockInstance;
  let fetchActiveEnrollmentsByStudentIdsSpy: MockInstance;
  let findClassesByIdsSpy: MockInstance;
  let getUserProfileByInstructorIdsSpy: MockInstance;

  let findAllByInstructorIdSpy: MockInstance;
  let findAllByDojoIdSpy: MockInstance;
  let fetchActiveEnrollmentsByClassIdsSpy: MockInstance;
  let fetchStudentsWithUsersByIdsSpy: MockInstance;

  beforeEach(() => {
    dbSpies = createDrizzleDbSpies();

    findOneByUserIdSpy = vi.spyOn(StudentRepository, "findOneByUserId");
    fetchActiveEnrollmentsByStudentIdsSpy = vi.spyOn(
      ClassEnrollmentRepository,
      "fetchActiveEnrollmentsByStudentIds",
    );
    findClassesByIdsSpy = vi.spyOn(ClassRepository, "findClassesByIds");
    getUserProfileByInstructorIdsSpy = vi.spyOn(UserRepository, "getUserProfileByInstructorIds");

    findAllByInstructorIdSpy = vi.spyOn(ClassRepository, "findAllByInstructorId");
    fetchActiveEnrollmentsByClassIdsSpy = vi.spyOn(
      ClassEnrollmentRepository,
      "fetchActiveEnrollmentsByClassIds",
    );
    fetchStudentsWithUsersByIdsSpy = vi.spyOn(StudentRepository, "fetchStudentsWithUsersByIds");

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    findAllByDojoIdSpy = vi.spyOn(ClassRepository, "findAllByDojoId");
    fetchActiveEnrollmentsByClassIdsSpy = vi.spyOn(
      ClassEnrollmentRepository,
      "fetchActiveEnrollmentsByClassIds",
    );
    fetchStudentsWithUsersByIdsSpy = vi.spyOn(StudentRepository, "fetchStudentsWithUsersByIds");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getEnrolledClasses", () => {
    const currentUser = buildUserMock({ role: Role.Child });
    const student = { id: "student-1", studentUserId: currentUser.id };
    const enrollment = { classId: "class-1", studentId: "student-1", active: true };
    const classData = buildClassMock({ id: "class-1", instructorId: "instructor-1" });
    const instructorProfile = {
      firstName: "Sensei",
      lastName: "John",
      instructorId: "instructor-1",
      id: "instructor-1",
    };

    it("should return enrolled classes", async () => {
      findOneByUserIdSpy.mockResolvedValue(student);
      fetchActiveEnrollmentsByStudentIdsSpy.mockResolvedValue([enrollment]);
      findClassesByIdsSpy.mockResolvedValue([classData]);
      getUserProfileByInstructorIdsSpy.mockResolvedValue([instructorProfile]);

      const result = await StudentService.getEnrolledClasses({ currentUser });

      expect(findOneByUserIdSpy).toHaveBeenCalledWith(currentUser.id, expect.anything());
      expect(fetchActiveEnrollmentsByStudentIdsSpy).toHaveBeenCalledWith(
        [student.id],
        expect.anything(),
      );
      expect(findClassesByIdsSpy).toHaveBeenCalledWith([enrollment.classId], expect.anything());
      expect(getUserProfileByInstructorIdsSpy).toHaveBeenCalledWith(
        [classData.instructorId],
        expect.anything(),
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(classData.id);
      expect(result[0].instructor).toBeDefined();
      expect(result[0].schedules).toEqual([]);
    });

    it("should return empty array if no enrollments", async () => {
      findOneByUserIdSpy.mockResolvedValue(student);
      fetchActiveEnrollmentsByStudentIdsSpy.mockResolvedValue([]);

      const result = await StudentService.getEnrolledClasses({ currentUser });

      expect(result).toEqual([]);
      expect(findClassesByIdsSpy).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if student not found", async () => {
      findOneByUserIdSpy.mockResolvedValue(null);

      await expect(StudentService.getEnrolledClasses({ currentUser })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("fetchAllInstructorStudents", () => {
    const instructorId = "ins-123";

    it("should return unique students across multiple instructor classes using mock builders", async () => {
      const mockClasses = [
        buildClassMock({ id: "class-1", instructorId }),
        buildClassMock({ id: "class-2", instructorId }),
      ];
      vi.spyOn(ClassRepository, "findAllByInstructorId").mockResolvedValue(mockClasses as any);

      const mockEnrollments = [
        buildEnrollmentMock({ studentId: "student-A", classId: "class-1" }),
        buildEnrollmentMock({ studentId: "student-A", classId: "class-2" }),
        buildEnrollmentMock({ studentId: "student-B", classId: "class-2" }),
      ];
      vi.spyOn(ClassEnrollmentRepository, "fetchActiveEnrollmentsByClassIds").mockResolvedValue(
        mockEnrollments as any,
      );

      const mockStudentRows = [
        {
          student: buildStudentMock({ id: "student-A" }),
          user: buildUserMock({ id: "u1", firstName: "Alex" }),
        },
        {
          student: buildStudentMock({ id: "student-B" }),
          user: buildUserMock({ id: "u2", firstName: "Blake" }),
        },
      ];
      const studentSpy = vi
        .spyOn(StudentRepository, "fetchStudentsWithUsersByIds")
        .mockResolvedValue(mockStudentRows as any);

      const result = await StudentService.fetchAllInstructorStudents(instructorId);

      expect(studentSpy).toHaveBeenCalledWith(["student-A", "student-B"], expect.anything());
      expect(result).toHaveLength(2);
      expect(result[0].studentUser.firstName).toBe("Alex");
    });

    it("should return empty array if instructor has no classes", async () => {
      vi.spyOn(ClassRepository, "findAllByInstructorId").mockResolvedValue([]);
      const result = await StudentService.fetchAllInstructorStudents(instructorId);
      expect(result).toEqual([]);
    });
  });

  describe("fetchAllDojoStudents", () => {
    const dojoId = "wolf-dojo";

    it("should return a unique list of students for a dojo", async () => {
      const studentAId = "student-A";
      const studentBId = "student-B";

      findAllByDojoIdSpy.mockResolvedValue([
        buildClassMock({ id: "class-1" }),
        buildClassMock({ id: "class-2" }),
      ]);

      fetchActiveEnrollmentsByClassIdsSpy.mockResolvedValue([
        buildEnrollmentMock({ studentId: studentAId, classId: "class-1" }),
        buildEnrollmentMock({ studentId: studentAId, classId: "class-2" }),
        buildEnrollmentMock({ studentId: studentBId, classId: "class-2" }),
      ]);

      fetchStudentsWithUsersByIdsSpy.mockResolvedValue([
        {
          student: buildStudentMock({ id: studentAId, studentUserId: "u1" }),
          user: buildUserMock({ id: "u1", firstName: "Alex" }),
        },
        {
          student: buildStudentMock({ id: studentBId, studentUserId: "u2" }),
          user: buildUserMock({ id: "u2", firstName: "Blake" }),
        },
      ]);

      const result = await StudentService.fetchAllDojoStudents(dojoId);

      expect(result).toHaveLength(2);
      expect(result[0].studentUser.firstName).toBe("Alex");
    });
  });
});
