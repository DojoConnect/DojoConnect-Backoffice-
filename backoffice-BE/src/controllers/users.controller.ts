import { NextFunction, Request, Response } from "express";
import { UsersService } from "../services/users.service.js";
import { formatApiResponse } from "../utils/api.utils.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";

export class UsersController {

  static getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new InternalServerErrorException("User not found");
      }

      const user = req.user;

      const result = await UsersService.getUserDTO(user);
      
      res.json(
        formatApiResponse({
          data: result
        }),
      );
    } catch (error) {
      next(error);
    }
  };

  static updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new InternalServerErrorException("User not found");
      }

      const user = req.user;
      const update = req.body;

      const result = await UsersService.updateProfile(user, update);

      res.json(
        formatApiResponse({
          data: result,
          message: "Profile updated successfully",
        }),
      );
    } catch (error) {
      next(error);
    }
  };

  static updateProfileImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new InternalServerErrorException("User not found");
      }

      const user = req.user;
      const update = req.body;

      const result = await UsersService.updateProfileImage(user, update);

      res.json(
        formatApiResponse({
          data: result,
          message: "Profile image updated successfully",
        }),
      );
    } catch (error) {
      next(error);
    }
  };
}
