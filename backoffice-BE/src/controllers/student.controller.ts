import { NextFunction, Request, Response } from "express";
import { StudentService } from "../services/student.service.js";
import { formatApiResponse } from "../utils/api.utils.js";
import { UnauthorizedException } from "../core/errors/UnauthorizedException.js";

export class StudentController {
  static handleGetEnrolledClasses = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      throw new UnauthorizedException("Unauthorized");
    }

    const result = await StudentService.getEnrolledClasses({
      currentUser: req.user!,
    });

    res.status(200).json(
      formatApiResponse({
        data: result,
      })
    );
    
  };
}
