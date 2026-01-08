import { Request, Response, NextFunction } from "express";
import { DojosService } from "../../services/dojos.service.js";
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from "../../core/errors/index.js";
import { InstructorService } from "../../services/instructor.service.js";

export const isMemberOfInstructorDojoMiddleware = async (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedException("Unauthenticated");
    }

    const instructorId = req.params.instructorId || req.query.instructorId || req.body.instructorId;


    if (!instructorId) {
      throw new BadRequestException("Missing instructorId");
    }

    const instructor = await InstructorService.getOneById(instructorId);

    if (!instructor) {
      throw new NotFoundException("Instructor not found");
    }

    const userDojo = await DojosService.fetchUserDojo({ user: req.user });

    if (!userDojo) {
      throw new NotFoundException("User's dojo not found");
    }

    if (userDojo.id !== instructor.dojoId) {
      throw new ForbiddenException("Access Denied: Instructor does not belong to the user's dojo");
    }

    req.dojo = userDojo;
    req.instructor = instructor;

    next();
  } catch (error) {
    if (error instanceof HttpException) {
      next(error);
    } else {
      next(new ForbiddenException("Forbidden: Access Denied"));
    }
  }
};
