import { NextFunction, Request, Response } from "express";
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "../../core/errors/index.js";
import { ClassService } from "../../services/class.service.js";
import { DojosService } from "../../services/dojos.service.js";
import { Role } from "../../constants/enums.js";
import { InstructorsRepository } from "../../repositories/instructors.repository.js";
import { InstructorService } from "../../services/instructor.service.js";

export const isClassInstructorOrDojoOwnerMiddleware = async (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedException("Unauthenticated");
    }

    const classId = req.params.classId as string;

    if (!classId) {
      throw new BadRequestException("Missing classId");
    }

    const dojoClass = await ClassService.getClassById(classId);

    if (!dojoClass) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const dojo = await DojosService.getOneDojoByID(dojoClass.dojoId);

    if (!dojo) {
      throw new NotFoundException("Class Dojo not found");
    }

    // 1. Check if user is Dojo Owner
    if (dojo.ownerUserId === req.user.id) {
        req.dojo = dojo;
        return next();
    }

    // 2. If not owner, check if user is Instructor for THIS class
    if (req.user.role === Role.Instructor) {
        if (!dojoClass.instructorId) {
             throw new ForbiddenException("Access Denied: You are not the instructor for this class");
        }
        
        const dojoInstructor = await InstructorService.findOneByUserIdAndDojoId(req.user.id, dojo.id);
        
        if (!dojoInstructor) {
            // Should theoretically be impossible if they are an instructor user, but good sanity check
             throw new ForbiddenException("Access Denied: Instructor profile not found for this Dojo");
        }

        if (dojoClass.instructorId !== dojoInstructor.id) {
             throw new ForbiddenException("Access Denied: You are not the assigned instructor for this class");
        }

        req.dojo = dojo;
        return next();
    }

    throw new ForbiddenException("Access Denied: You are not the owner of this Dojo or the assigned instructor for this class");

  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException("Authorization failed");
  }
};
