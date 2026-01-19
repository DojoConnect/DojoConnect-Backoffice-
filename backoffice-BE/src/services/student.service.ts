import { Transaction } from "../db/index.js";
import { StudentRepository } from "../repositories/student.repository.js";
import * as dbService from "../db/index.js";
import { ClassDTO } from "../dtos/class.dtos.js";
import { IUser, UserRepository, InstructorUserDetails } from "../repositories/user.repository.js";
import { NotFoundException } from "../core/errors/index.js";
import { ClassEnrollmentRepository } from "../repositories/enrollment.repository.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { StudentUserDTO } from "../dtos/student.dtos.js";

export class StudentService {
    static getOneStudentByID = async (studentId: string, txInstance?: Transaction) => {
        const execute = async (tx: Transaction) => {
            return await StudentRepository.findOneById(studentId, tx);
        }

        return txInstance
            ? execute(txInstance)
            : dbService.runInTransaction(execute);
    }

    static getEnrolledClasses = async ({
        currentUser,
        txInstance,
    }: {
        currentUser: IUser;
        txInstance?: Transaction;
    }): Promise<ClassDTO[]> => {
        const execute = async (tx: Transaction) => {
            const student = await StudentRepository.findOneByUserId(currentUser.id, tx);

            if (!student) {
                throw new NotFoundException("Student not found");
            }

            const enrollments = await ClassEnrollmentRepository.fetchActiveEnrollmentsByStudentIds(
                [student.id],
                tx
            );

            if (enrollments.length === 0) {
                return [];
            }

            const classIds = enrollments.map((enrollment) => enrollment.classId);
            const uniqueClassIds = Array.from(new Set(classIds));

            const classes = await ClassRepository.findClassesByIds(
                uniqueClassIds,
                tx
            );

            const instructorIds = classes.map((classData) => classData.instructorId).filter((id) => id !== null);

            const instructors = await UserRepository.getUserProfileByInstructorIds(
                instructorIds,
                tx
            );

            const instructorMap = new Map(instructors.map((instructor) => [instructor.id, instructor]));

            return classes.map((classData) => {
                let instructor: InstructorUserDetails | null | undefined = null;

                if (classData.instructorId) {
                    instructor = instructorMap.get(classData.instructorId);
                }

                return new ClassDTO({
                    ...classData,
                    instructor,
                    schedules: [],
                });
            });
        };

        return txInstance
            ? execute(txInstance)
            : dbService.runInTransaction(execute);
    };

    static fetchAllDojoStudents = async (dojoId: string, txInstance?: Transaction): Promise<StudentUserDTO[]> => {
        const execute = async (tx: Transaction) => {
            
            const classes = await ClassRepository.findAllByDojoId(dojoId, tx);
            if (classes.length === 0) return [];

            const classIds = classes.map((c) => c.id);

            const enrollments = await ClassEnrollmentRepository.fetchActiveEnrollmentsByClassIds(classIds, tx);
            if (enrollments.length === 0) return [];

            const uniqueStudentIds = Array.from(new Set(enrollments.map((e) => e.studentId)));

            const studentDetails = await StudentRepository.fetchStudentsWithUsersByIds(uniqueStudentIds, tx);

            return studentDetails.map((row) => 
                new StudentUserDTO({
                    id: row.student.id,
                    studentUserId: row.student.studentUserId,
                    parentId: row.student.parentId,
                    experience: row.student.experienceLevel,
                    studentUser: row.user,
                })
            );
        };

        return txInstance 
        ? execute(txInstance) 
        : dbService.runInTransaction(execute);
    };
}