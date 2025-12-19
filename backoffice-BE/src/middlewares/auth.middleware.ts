import { Request, Response, NextFunction } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import AppConfig from "../config/AppConfig";
import * as userService from "../services/users.service";
import { NotFoundException } from "../core/errors/NotFoundException";
import type { TokenPayload } from "../utils/auth.utils";
import { UnauthorizedException } from "../core/errors/UnauthorizedException";
import { HttpException } from "../core/errors/HttpException";
import { IUser } from "../repositories/user.repository";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Invalid token");
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(
      token,
      AppConfig.JWT_ACCESS_SECRET
    ) as TokenPayload;

    // Optionally: check if user still exists and is active
    const user = await userService.getOneUserByID({ userId: decoded.userId });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new UnauthorizedException("Token expired");
    }

    if (error instanceof HttpException) {
      throw error;
    }

    throw new UnauthorizedException("Invalid token");
  }
};
