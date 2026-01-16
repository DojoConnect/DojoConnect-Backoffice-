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
  next: NextFunction
) => {
  try {
    const parentUser = req.user;
    if (!parentUser) {
      throw new UnauthorizedException("Unauthenticated");
    }

    const studentId = req.params.studentId || req.body.studentId || req.query.studentId;

    if (!studentId) {
      throw new BadRequestException("Missing studentId");
    }

    const student = await StudentService.getOneStudentByID(studentId);

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const parent = await ParentService.getOneParentByUserId(parentUser.id);

    if (!parent) {
      throw new NotFoundException("Parent not found");
    }

    if (student.parentId !== parent.id) {
      throw new ForbiddenException("Access Denied: User is not the parent of this student");
    }

    next();
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new ForbiddenException("Forbidden: Access Denied");
  }
};
