// src/middlewares/require-role.ts
import { Request, Response, NextFunction } from "express";
import {DojosService} from "../services/dojos.service.js";
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from "../core/errors/index.js";

export const isDojoOwnerMiddleware = async (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedException("Unauthenticated");
    }

    if (!req.params.dojoId) {
      throw new BadRequestException("Missing dojoId");
    }

    const dojo = await DojosService.getOneDojoByID(req.params.dojoId);

    if (!dojo) {
      throw new NotFoundException("Dojo not found");
    }

    if (dojo.userId !== req.user.id) {
      throw new ForbiddenException("Access Denied");
    }

    req.dojo = dojo;

    next();
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new ForbiddenException("Forbidden: Access Denied");
  }
};
