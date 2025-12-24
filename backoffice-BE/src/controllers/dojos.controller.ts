import { Request, Response } from "express";
import { DojosService } from "../services/dojos.service.js";
import {
  BadRequestException,
  InternalServerErrorException,
} from "../core/errors/index.js";
import { formatApiResponse } from "../utils/api.utils.js";
import { NotFoundException } from "../core/errors/index.js";

export class DojosController {
  static async handleFetchDojoByTag(req: Request, res: Response) {
    const slug = req.params.slug;
    if (!slug) {
      throw new BadRequestException("Slug is required");
    }

    const dojo = await DojosService.getOneDojoByTag(req.params.slug);

    if (!dojo) {
      throw new NotFoundException(`Dojo with slug ${slug} not found`);
    }

    res.json(formatApiResponse({ data: dojo }));
  }

  static async handleFetchInvitedInstructors(req: Request, res: Response) {
    const dojoId = req.params.dojoId;
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

    res
      .status(201)
      .json(
        formatApiResponse({
          data: undefined,
          message: "Instructor invited successfully",
        })
      );
  }
}
