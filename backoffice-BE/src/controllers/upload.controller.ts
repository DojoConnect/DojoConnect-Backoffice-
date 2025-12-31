import { NextFunction, Request, Response } from "express";
import { GetCloudinarySignatureDto } from "../dtos/upload.dtos.js";
import { CloudinaryService } from "../services/cloudinary.service.js";
import { formatApiResponse } from "../utils/api.utils.js";

export class UploadController {
  static handleGetCloudinarySignature = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { imageType, dojoId } = req.body as GetCloudinarySignatureDto;

      const signature = CloudinaryService.getCloudinarySignature({
        imageType,
        dojoId,
      });

      res.status(200).json(
            formatApiResponse({
              data: signature,
            })
          );
    } catch (error) {
      next(error);
    }
  };
}
