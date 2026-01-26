import { NextFunction, Request, Response } from "express";
import { UsersService } from "../services/users.service.js";
import { formatApiResponse } from "../utils/api.utils.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";

export class UsersController {
  static updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new InternalServerErrorException("User not found");
      }

      const userId = req.user.id;
      const update = req.body;

      const result = await UsersService.updateProfile(userId, update);

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
}
