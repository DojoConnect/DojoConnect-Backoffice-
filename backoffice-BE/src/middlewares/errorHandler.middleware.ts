import { NextFunction, Request, Response } from "express";
import { HttpException } from "../core/errors/HttpException";

export const errorHandler = (err, _req: Request, res: Response, _next: NextFunction) => {
  // If it's a known HttpException, use its status & message
  if (err instanceof HttpException) {
    return res.status(err.status).json({
      status: "error",
      message: err.message,
      errors: err.errors || undefined,
    });
  }

  // Otherwise it's an unexpected server error
  console.error(err);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
