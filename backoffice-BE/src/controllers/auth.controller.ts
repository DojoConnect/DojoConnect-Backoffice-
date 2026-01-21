import { Request, Response } from "express";

import { AuthService } from "../services/auth.service.js";
import { formatApiResponse } from "../utils/api.utils.js";
import { BadRequestException } from "../core/errors/index.js";

export const handleRegisterDojoAdmin = async (req: Request, res: Response) => {
  const userIp = req.ip;
  const userAgent = req.headers["user-agent"];

  const result = await AuthService.registerDojoAdmin({
    dto: req.body,
    userIp,
    userAgent,
  });

  res.status(201).json(
    formatApiResponse({
      data: result,
      message: "User registered successfully",
    }),
  );
};

export const handleRegisterParent = async (req: Request, res: Response) => {
  const userIp = req.ip;
  const userAgent = req.headers["user-agent"];

  const result = await AuthService.registerParent({
    dto: req.body,
    userIp,
    userAgent,
  });

  res.status(201).json(
    formatApiResponse({
      data: result,
      message: "Parent registered successfully",
    }),
  );
};

export const loginUser = async (req: Request, res: Response) => {
  const userIp = req.ip;
  const userAgent = req.headers["user-agent"];

  const result = await AuthService.loginUser({
    dto: req.body,
    userIp,
    userAgent,
  });

  res.json(formatApiResponse({ data: result, message: "Login successful" }));
};

export const refreshUserToken = async (req: Request, res: Response) => {
  const userIp = req.ip;
  const userAgent = req.headers["user-agent"];

  const result = await AuthService.refreshAccessToken({
    dto: req.body,
    userIp,
    userAgent,
  });

  res.json(formatApiResponse({ data: result, message: "Authentication successful" }));
};

export const logoutUser = async (req: Request, res: Response) => {
  await AuthService.logoutUser({
    dto: req.body,
  });

  res.json(formatApiResponse({ data: undefined, message: "successful" }));
};

export const handleIsUsernameAvailable = async (req: Request, res: Response) => {
  const username = req.params.username as string;
  const available = await AuthService.isUsernameAvailable({ username });

  res.json(formatApiResponse({ data: { available } }));
};

export const handleIsDojoTagAvailable = async (req: Request, res: Response) => {
  const tag = req.params.tag as string;
  const available = await AuthService.isDojoTagAvailable({ tag });

  res.json(formatApiResponse({ data: { available } }));
};

export const handleFirebaseLogin = async (req: Request, res: Response) => {
  const userIp = req.ip;
  const userAgent = req.headers["user-agent"];

  const result = await AuthService.firebaseSignIn({
    dto: req.body,
    userIp,
    userAgent,
  });

  res.json(formatApiResponse({ data: result, message: "Login successful" }));
};

export const handleInitForgetPassword = async (req: Request, res: Response) => {
  try {
    await AuthService.initForgetPassword({ dto: req.body });
  } catch (err) {
    console.log("Error while trying to Init forget password: ", err);
  } finally {
    res.status(200).json(
      formatApiResponse({
        data: undefined,
        message: "If an account exists, you will receive an OTP code.",
      }),
    );
  }
};

export const handleVerifyOtp = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.verifyOtp({ dto: req.body });
    res.json(formatApiResponse({ data: result }));
  } catch (error) {
    throw new BadRequestException("Invalid OTP or expired");
  }
};

export const handleResetPassword = async (req: Request, res: Response) => {
  try {
    await AuthService.resetPassword({ dto: req.body });
    res.json(
      formatApiResponse({
        data: undefined,
        message: "Password reset successful",
      }),
    );
  } catch (error) {
    throw new BadRequestException("Reset Password Token expired or invalid");
  }
};
