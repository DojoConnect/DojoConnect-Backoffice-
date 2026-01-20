// src/middlewares/require-role.ts
import { Request, Response, NextFunction } from "express";
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from "../../core/errors/index.js";
import { StudentService } from "../../services/student.service.js";
import { ParentService } from "../../services/parent.service.js";

export const isParentOfStudentMiddleware = async (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  try {
    const parentUser = req.user;
    if (!parentUser) {
      throw new UnauthorizedException("Unauthenticated");
    }

    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new BadRequestException("Missing or invalid studentIds");
    }

    const parent = await ParentService.getOneParentByUserId(parentUser.id);

    if (!parent) {
      throw new NotFoundException("Parent not found");
    }

    // Verify all students belong to this parent
    const students = await Promise.all(
      studentIds.map((id) => StudentService.getOneStudentByID(id)),
    );

    // Check if any student invalid or belongs to another parent
    const unauthorizedStudent = students.find((s) => !s || s.parentId !== parent.id);

    if (unauthorizedStudent) {
      throw new ForbiddenException(
        "Access Denied: You are not authorized to act as parent for one or more of these students",
      );
    }

    next();
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new ForbiddenException("Forbidden: Access Denied");
  }
};
