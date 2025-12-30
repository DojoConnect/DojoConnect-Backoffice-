import { Request, Response } from "express";
import { ClassService } from "../services/class.service.js";
import { formatApiResponse } from "../utils/api.utils.js";
import { ClassDTO } from "../dtos/class.dtos.js";
import {
  InternalServerErrorException,
  ForbiddenException,
} from "../core/errors/index.js";

export class ClassesController {
  static async createClass(req: Request, res: Response) {
    const dojo = req.dojo;
    if (!dojo) {
      throw new InternalServerErrorException(
        "Dojo not found on request object."
      );
    }

    const newClass = await ClassService.createClass({
      dto: req.body,
      dojo: dojo,
    });

    res.status(201).json(
      formatApiResponse({
        data: newClass,
        message: "Class created successfully.",
      })
    );
  }

  static async getClasses(req: Request, res: Response) {
    const dojo = req.dojo;
    if (!dojo) {
      throw new InternalServerErrorException(
        "Dojo not found on request object."
      );
    }

    const classes = await ClassService.getAllClassesByDojoId(dojo.id);
    const classDTOs = classes.map((c) => new ClassDTO(c));

    res
      .status(200)
      .json(
        formatApiResponse({ data: classDTOs, message: "Classes fetched." })
      );
  }

  static async getClassById(req: Request, res: Response) {
    const { classId } = req.params;
    const dojo = req.dojo;
    if (!dojo) {
      throw new InternalServerErrorException(
        "Dojo not found on request object."
      );
    }

    const classData = await ClassService.getOneClassById(classId);

    if (classData.dojoId !== dojo.id) {
      throw new ForbiddenException("Class does not belong to this dojo.");
    }

    const classDTO = new ClassDTO(classData);

    res
      .status(200)
      .json(
        formatApiResponse({ data: classDTO, message: "Class fetched." })
      );
  }
}