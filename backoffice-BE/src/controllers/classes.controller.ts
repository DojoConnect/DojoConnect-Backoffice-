import { Request, Response } from "express";
import { ClassService } from "../services/class.service.js";
import { formatApiResponse } from "../utils/api.utils.js";
import { ClassDTO } from "../dtos/class.dtos.js";

export class ClassesController {

  static async getClassById(req: Request, res: Response) {
    const { classId } = req.params;

    const classData = await ClassService.getClassInfo(classId);

    const classDTO = new ClassDTO(classData);

    res
      .status(200)
      .json(formatApiResponse({ data: classDTO, message: "Class fetched." }));
  }

  static async updateClass(req: Request, res: Response) {
    const { classId } = req.params;

    const updatedClass = await ClassService.updateClass({
      classId,
      dto: req.body,
    });

    res.status(200).json(
      formatApiResponse({
        data: updatedClass,
        message: "Class updated successfully.",
      })
    );
  }

  static async updateClassInstructor(req: Request, res: Response) {
    const { classId } = req.params;
    const { instructorId } = req.body;

    const updatedClass = await ClassService.updateClassInstructor({
      classId,
      instructorId,
    });

    res.status(200).json(
      formatApiResponse({
        data: updatedClass,
        message: "Class instructor updated successfully.",
      })
    );
  }
}
