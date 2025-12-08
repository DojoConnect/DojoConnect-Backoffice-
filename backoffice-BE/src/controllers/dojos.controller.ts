import { Request, Response } from "express";
import * as dojosService from "../services/dojos.service";
import { BadRequestException } from "../core/errors/BadRequestException";
import { formatApiResponse } from "../utils/api.utils";
import { NotFoundException } from "../core/errors/NotFoundException";

export async function fetchDojoBySlug(req: Request, res: Response) {
  const slug = req.params.slug;
  if (!slug) {
    throw new BadRequestException("Slug is required");
  }

  const dojo = await dojosService.fetchDojoBySlug(req.params.slug);

  if (!dojo) {
      throw new NotFoundException(`Dojo with slug ${slug} not found`);
    }

  res.json(formatApiResponse({ data: dojo }));
}
