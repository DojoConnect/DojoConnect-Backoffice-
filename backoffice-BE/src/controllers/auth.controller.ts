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

  res.json(
    formatApiResponse({ data: result, message: "User registered successfully" })
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
