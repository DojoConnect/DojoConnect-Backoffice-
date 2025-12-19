import { Request, Response, NextFunction } from "express";
import { Role } from "../constants/enums";
import { HttpException, UnauthorizedException } from "../core/errors";
import { ForbiddenException } from "../core/errors/ForbiddenException";

export const requireRole =
  (...allowedRoles: readonly Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedException("Unauthenticated");
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenException("Forbidden: insufficient permissions");
      }

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new ForbiddenException("Forbidden: insufficient permissions");
    }
  };
