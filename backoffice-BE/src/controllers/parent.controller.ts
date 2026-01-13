import { NextFunction, Request, Response } from "express";
import { ParentService } from "../services/parent.service.js";
import { formatApiResponse } from "../utils/api.utils.js";

export const handleAddChild = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await ParentService.addChild({
      parent: req.user!,
      dto: req.body,
    });

    res.status(201).json(
      formatApiResponse({
        data: result,
        message: "Child added successfully",
      })
    );
  } catch (error) {
    next(error);
  }
};
