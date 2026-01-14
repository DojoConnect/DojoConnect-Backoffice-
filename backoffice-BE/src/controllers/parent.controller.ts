import { NextFunction, Request, Response } from "express";
import { ParentService } from "../services/parent.service.js";
import { formatApiResponse } from "../utils/api.utils.js";

export class ParentController {

static handleAddChild = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await ParentService.addChild({
      parentUser: req.user!,
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

static handleGetChildren = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await ParentService.getChildren({
      currentUser: req.user!,
    });

    res.status(200).json(
      formatApiResponse({
        data: result,
      })
    );
  } catch (error) {
    next(error);
  }
};
}