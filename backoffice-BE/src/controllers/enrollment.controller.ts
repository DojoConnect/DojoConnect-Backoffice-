import { Request, Response } from "express";
import { EnrollmentService } from "../services/enrollment.service.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";
import { formatApiResponse } from "../utils/api.utils.js";

export class EnrollmentController {
  static enrollStudent = async (req: Request, res: Response) => {
      if (!req.user) {
         throw new InternalServerErrorException("User not found in request");
      }

      const { classId } = req.params;
      const { studentId } = req.body;

      const result = await EnrollmentService.enrollStudent({
        parentUser: req.user,
        classId,
        studentId,
      });

      res.status(200).json(formatApiResponse({ data: result }));
    
  };
}
