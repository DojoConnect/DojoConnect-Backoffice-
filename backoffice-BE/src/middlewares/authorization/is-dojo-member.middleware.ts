import { Request, Response, NextFunction } from "express";
import { DojosService } from "../../services/dojos.service.js";
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from "../../core/errors/index.js";

export const isDojoMemberMiddleware = async (req: Request, _: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedException("Unauthenticated");
    }

    const dojoId = req.params.dojoId || req.query.dojoId || req.body.dojoId;

    if (!dojoId) {
      throw new BadRequestException("Missing dojoId");
    }

    const userDojo = await DojosService.fetchUserDojo({ user: req.user });

    if (!userDojo) {
      throw new NotFoundException("Dojo not found");
    }

    if (userDojo.id !== dojoId) {
      throw new ForbiddenException("Access Denied");
    }

    req.dojo = userDojo;

    next();
  } catch (error) {
    if (error instanceof HttpException) {
      next(error);
    } else {
      next(new ForbiddenException("Forbidden: Access Denied"));
    }
  }
};
