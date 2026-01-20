import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import AppConfig from "../config/AppConfig.js";
import { UsersService } from "../services/users.service.js";
import { NotFoundException } from "../core/errors/index.js";
import type { TokenPayload } from "../utils/auth.utils.js";
import { UnauthorizedException } from "../core/errors/index.js";
import { HttpException } from "../core/errors/index.js";
import { IUser } from "../repositories/user.repository.js";
import { IDojo } from "../repositories/dojo.repository.js";
import { IDojoInstructor } from "../repositories/instructors.repository.js";

export interface AuthenticatedRequest extends Request {
  user: IUser;
}

// Now you can access TokenExpiredError from the imported jwt object
const { TokenExpiredError } = jwt;

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      dojo?: IDojo;
      instructor?: IDojoInstructor;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Invalid token");
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, AppConfig.JWT_ACCESS_SECRET) as TokenPayload;

    // Optionally: check if user still exists and is active
    const user = await UsersService.getOneUserByID({ userId: decoded.userId });
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
