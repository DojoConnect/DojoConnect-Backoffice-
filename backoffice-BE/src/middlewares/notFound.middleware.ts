import { NextFunction } from "express";
import { NotFoundException } from "../core/errors/index.js";

export const notFound = (_req, _res, next: NextFunction) => {
  next(new NotFoundException("Route not found"));
};
