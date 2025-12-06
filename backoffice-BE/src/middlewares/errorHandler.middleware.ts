import { NextFunction, Request, Response } from "express";
import { HttpException } from "../core/errors/HttpException";

export const errorHandler = (
  err,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // If it's a known HttpException, use its status & message
  if (err instanceof HttpException) {
    return res.status(err.status).json({
      message: err.message,
      errors: err.errors || undefined,
    });
  }

  // Handle other common HTTP errors (like body-parser) that have a status code
  if (err.status) {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  // Otherwise it's an unexpected server error
  console.error("UNHANDLED_ERROR:", err);

  return res.status(500).json({
    message: "Internal server error",
  });
};
