import { Request, Response } from "express";
import { DojosService } from "../services/dojos.service.js";
import { BadRequestException, InternalServerErrorException } from "../core/errors/index.js";
import { formatApiResponse } from "../utils/api.utils.js";
import { NotFoundException } from "../core/errors/index.js";
import { ClassService } from "../services/class.service.js";
import { ClassDTO } from "../dtos/class.dtos.js";
import { StudentService } from "../services/student.service.js";

export class DojosController {
  static async handleFetchDojoByTag(req: Request, res: Response) {
    const tag = req.params.tag as string;
    if (!tag) {
      throw new BadRequestException("Slug is required");
    }

    const dojo = await DojosService.getOneDojoByTag(tag);

    if (!dojo) {
      throw new NotFoundException(`Dojo with tag ${tag} not found`);
    }

    res.json(formatApiResponse({ data: dojo }));
  }

  static async handleFetchInvitedInstructors(req: Request, res: Response) {
    const dojoId = req.params.dojoId as string;
    if (!dojoId) {
      throw new BadRequestException("Dojo ID is required");
    }

    const instructors = await DojosService.fetchInvitedInstructors({
      dojoId,
    });

    res.json(formatApiResponse({ data: instructors }));
  }

  static async handleInviteInstructor(req: Request, res: Response) {
    const dojo = req.dojo;
    const user = req.user;

    if (!dojo) {
      throw new InternalServerErrorException("Dojo is required");
    }

    if (!user) {
      throw new InternalServerErrorException("User is required");
    }

    await DojosService.inviteInstructor({
      dojo,
      user,
      dto: req.body,
    });

    res.status(201).json(
      formatApiResponse({
        data: undefined,
        message: "Instructor invited successfully",
      }),
    );
  }

  static async handleFetchDojoInstructors(req: Request, res: Response) {
    const dojoId = req.params.dojoId as string;

    const instructors = await DojosService.fetchInstructors({ dojoId });

    res.status(200).json(
      formatApiResponse({
        data: instructors,
        message: "Instructors fetched successfully",
      }),
    );
  }

  static async createClass(req: Request, res: Response) {
    const dojo = req.dojo;
    if (!dojo) {
      throw new InternalServerErrorException("Dojo not found on request object.");
    }

    const newClass = await ClassService.createClass({
      dto: req.body,
      dojo: dojo,
    });

    res.status(201).json(
      formatApiResponse({
        data: newClass,
        message: "Class created successfully.",
      }),
    );
  }

  static async getClasses(req: Request, res: Response) {
    const dojo = req.dojo;
    if (!dojo) {
      throw new InternalServerErrorException("Dojo not found on request object.");
    }

    const classes = await ClassService.getAllClassAndInstructorsByDojoId(dojo.id);
    const classDTOs = classes.map((c) => new ClassDTO(c));

    res.status(200).json(formatApiResponse({ data: classDTOs, message: "Classes fetched." }));
  }

  static async handleFetchDojoStudents(req: Request, res: Response) {
    const dojo = req.dojo;

    if (!dojo) {
      throw new InternalServerErrorException("Dojo not found on request object.");
    }

    const students = await StudentService.fetchAllDojoStudents(dojo.id);

    res.status(200).json(
      formatApiResponse({
        data: students.map((student) => student.toJSON()),
        message: "Dojo students fetched successfully",
      }),
    );
  }
}
