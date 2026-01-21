/**
 * Middleware to check if authenticated user is a member of the class.
 *
 * Class membership is determined by role:
 * - Child: Must be enrolled in the class
 * - Parent: Must have a child enrolled in the class
 * - Instructor: Must be assigned to the class
 * - DojoAdmin: Must own the dojo that the class belongs to
 */
import { NextFunction, Request, Response } from "express";
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "../../core/errors/index.js";
import * as dbService from "../../db/index.js";
import { Role } from "../../constants/enums.js";
import { ClassRepository } from "../../repositories/class.repository.js";
import { ClassEnrollmentRepository } from "../../repositories/enrollment.repository.js";
import { StudentRepository } from "../../repositories/student.repository.js";
import { ParentRepository } from "../../repositories/parent.repository.js";
import { InstructorsRepository } from "../../repositories/instructors.repository.js";
import { DojoRepository } from "../../repositories/dojo.repository.js";

export const isClassMemberMiddleware = async (
  req: Request,
  _: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedException("Unauthenticated");
    }

    const classId = req.params.classId as string;

    if (!classId) {
      throw new BadRequestException("Missing classId");
    }

    const isMember = await dbService.runInTransaction(async (tx) => {
      const dojoClass = await ClassRepository.findById(classId, tx);

      if (!dojoClass) {
        throw new NotFoundException(`Class with ID ${classId} not found`);
      }

      const userId = req.user!.id;
      const role = req.user!.role as Role;

      switch (role) {
        case Role.DojoAdmin: {
          // Check if user owns the dojo that this class belongs to
          const dojo = await DojoRepository.getOneByID(dojoClass.dojoId, tx);
          return dojo?.ownerUserId === userId;
        }

        case Role.Instructor: {
          // Check if user is the assigned instructor for this class
          if (!dojoClass.instructorId) {
            return false;
          }
          const instructor = await InstructorsRepository.findOneByUserId(userId, tx);
          return instructor?.id === dojoClass.instructorId;
        }

        case Role.Parent: {
          // Check if user has any children enrolled in this class
          const parent = await ParentRepository.getOneParentByUserId(userId, tx);
          if (!parent) {
            return false;
          }

          const students = await StudentRepository.getStudentsByParentId(parent.id, tx);
          if (students.length === 0) {
            return false;
          }

          const studentIds = students.map((s) => s.student.id);
          const enrollments = await ClassEnrollmentRepository.fetchActiveEnrollmentsByStudentIds(
            studentIds,
            tx,
          );

          return enrollments.some((e) => e.classId === classId);
        }

        case Role.Child: {
          // Check if user (as student) is enrolled in the class
          const student = await StudentRepository.findOneByUserId(userId, tx);
          if (!student) {
            return false;
          }

          const enrollment =
            await ClassEnrollmentRepository.findOneActiveEnrollmentByClassIdAndStudentId(
              classId,
              student.id,
              tx,
            );

          return !!enrollment;
        }

        default:
          return false;
      }
    });

    if (!isMember) {
      throw new ForbiddenException("You are not a member of this class");
    }

    next();
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException("Authorization check failed");
  }
};
