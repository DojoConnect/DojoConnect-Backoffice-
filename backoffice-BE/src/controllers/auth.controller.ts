import { Request, Response } from "express";

import * as authService from "../services/auth.service";
import { formatApiResponse } from "../utils/api.utils";

export const registerUser = async (req: Request, res: Response) => {
  const userIp = req.ip;
  const userAgent = req.headers["user-agent"];

  const result = await authService.registerUser({
    userDTO: req.body,
    userIp,
    userAgent,
  });

  res.status(201).json(
    formatApiResponse({
      data: result,
      message: "User registered successfully",
    })
  );
};

export const loginUser = async (req: Request, res: Response) => {
  const userIp = req.ip;
  const userAgent = req.headers["user-agent"];

  const result = await authService.loginUser({
    dto: req.body,
    userIp,
    userAgent,
  });

  res.json(formatApiResponse({ data: result, message: "Login successful" }));
};

export const refreshUserToken = async (req: Request, res: Response) => {
  const userIp = req.ip;
  const userAgent = req.headers["user-agent"];

  const result = await authService.refreshAccessToken({
    dto: req.body,
    userIp,
    userAgent,
  });

  res.json(
    formatApiResponse({ data: result, message: "Authentication successful" })
  );
};

export const logoutUser = async (req: Request, res: Response) => {
  await authService.logoutUser({
    dto: req.body,
  });

  res.json(formatApiResponse({ data: undefined, message: "successful" }));
};
