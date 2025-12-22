import { Request, Response } from "express";
import {DojosService} from "../services/dojos.service.js";
import { BadRequestException } from "../core/errors/index.js";
import { formatApiResponse } from "../utils/api.utils.js";
import { NotFoundException } from "../core/errors/index.js";

export async function fetchDojoBySlug(req: Request, res: Response) {
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
