import { Request, Response } from "express";
import * as dojosService from "../services/dojos.service";
import { BadRequestException } from "../core/errors/BadRequestException";

export async function fetchDojoBySlug(req: Request, res: Response) {
  const slug = req.params.slug;
  if (!slug) {
    throw new BadRequestException("Slug is required");
  }

  const dojo = await dojosService.fetchDojoBySlug(req.params.slug);
  res.json(dojo);
}
