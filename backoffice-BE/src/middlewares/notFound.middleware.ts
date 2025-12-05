import { NextFunction } from "express";
import { NotFoundException } from "../core/errors/NotFoundException";


export const notFound = (_req, _res, next: NextFunction) => {
  next(new NotFoundException("Route not found"));
};
