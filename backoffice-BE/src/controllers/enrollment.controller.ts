import { Request, Response } from "express";
import { EnrollmentService } from "../services/enrollment.service.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";
import { formatApiResponse } from "../utils/api.utils.js";

export class EnrollmentController {
  static enrollStudent = async (req: Request, res: Response) => {
      if (!req.user) {
         throw new InternalServerErrorException("User not found in request");
      }

      const classId = req.params.classId as string;
      const { studentIds } = req.body;

      const result = await EnrollmentService.enrollStudents({
        parentUser: req.user,
        classId,
        studentIds,
      });

      res.status(200).json(formatApiResponse({ data: result }));
    
  };
}
