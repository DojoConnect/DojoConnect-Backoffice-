import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from "vitest";
import { StudentService } from "./student.service.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { ClassEnrollmentRepository } from "../repositories/enrollment.repository.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import { buildClassMock } from "../tests/factories/class.factory.js";
import { NotFoundException } from "../core/errors/index.js";
import { Role } from "../constants/enums.js";

describe("Student Service", () => {
    let dbSpies: DbServiceSpies;
    
    let findOneByUserIdSpy: MockInstance;
    let fetchActiveEnrollmentsByStudentIdsSpy: MockInstance;
    let findClassesByIdsSpy: MockInstance;
    let getUserProfileByInstructorIdsSpy: MockInstance;

    beforeEach(() => {
        dbSpies = createDrizzleDbSpies();
        
        findOneByUserIdSpy = vi.spyOn(StudentRepository, "findOneByUserId");
        fetchActiveEnrollmentsByStudentIdsSpy = vi.spyOn(ClassEnrollmentRepository, "fetchActiveEnrollmentsByStudentIds");
        findClassesByIdsSpy = vi.spyOn(ClassRepository, "findClassesByIds");
        getUserProfileByInstructorIdsSpy = vi.spyOn(UserRepository, "getUserProfileByInstructorIds");

        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("getEnrolledClasses", () => {
        const currentUser = buildUserMock({ role: Role.Child });
        const student = { id: "student-1", studentUserId: currentUser.id };
        const enrollment = { classId: "class-1", studentId: "student-1", active: true };
        const classData = buildClassMock({ id: "class-1", instructorId: "instructor-1" });
        const instructorProfile = { firstName: "Sensei", lastName: "John", instructorId: "instructor-1", id: "instructor-1" };

        it("should return enrolled classes", async () => {
            findOneByUserIdSpy.mockResolvedValue(student);
            fetchActiveEnrollmentsByStudentIdsSpy.mockResolvedValue([enrollment]);
            findClassesByIdsSpy.mockResolvedValue([classData]);
            getUserProfileByInstructorIdsSpy.mockResolvedValue([instructorProfile]);

            const result = await StudentService.getEnrolledClasses({ currentUser });

            expect(findOneByUserIdSpy).toHaveBeenCalledWith(currentUser.id, expect.anything());
            expect(fetchActiveEnrollmentsByStudentIdsSpy).toHaveBeenCalledWith([student.id], expect.anything());
            expect(findClassesByIdsSpy).toHaveBeenCalledWith([enrollment.classId], expect.anything());
            expect(getUserProfileByInstructorIdsSpy).toHaveBeenCalledWith([classData.instructorId], expect.anything());

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

            await expect(StudentService.getEnrolledClasses({ currentUser })).rejects.toThrow(NotFoundException);
        });
    });
});
