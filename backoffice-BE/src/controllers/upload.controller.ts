import { NextFunction, Request, Response } from "express";
import { formatApiResponse } from "../utils/api.utils.js";
import { UploadService } from "../services/uploads.service.js";
import { UnauthorizedException } from "../core/errors/UnauthorizedException.js";

export class UploadController {
  static handleGenerateClassImageUploadSignature = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const signature = await UploadService.generateClassImageUploadSignature(user);

      res.status(200).json(
        formatApiResponse({
          data: signature,
        }),
      );
    } catch (error) {
      next(error);
    }
  };

  static handleGenerateProfileImageUploadSignature = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const signature = await UploadService.generateProfileImageUploadSignature(user);

      res.status(200).json(
        formatApiResponse({
          data: signature,
        }),
      );
    } catch (error) {
      next(error);
    }
  };
}
