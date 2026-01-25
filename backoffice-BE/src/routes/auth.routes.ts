// Use express-rate-limit
import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import {
  handleIsUsernameAvailable,
  loginUser,
  logoutUser,
  refreshUserToken,
  handleRegisterDojoAdmin,
  handleRegisterParent,
  handleFirebaseLogin,
  handleInitForgetPassword,
  handleVerifyOtp,
  handleResetPassword,
  handleIsDojoTagAvailable,
} from "../controllers/auth.controller.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import {
  FirebaseSignInSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RefreshTokenSchema,
  RegisterDojoAdminSchema,
  RegisterParentSchema,
  ResetPasswordSchema,
  VerifyOtpSchema,
} from "../validations/auth.schemas.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    message: "Too many authentication attempts",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true },
});

const checkAvailabilityRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    message: "Too many availability checks. Please try again in a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CRITICAL: Much more aggressive rate limiting for OTP
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Only 3 OTP requests per 15 minutes
  message: {
    message: "Too many OTP requests. Please try again later.",
  },
  keyGenerator: (req) => req.body.email,
  skipFailedRequests: false,
});

// Additional IP-based rate limiting
const otpIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 OTP requests per hour from same IP
  message: {
    message: "Too many OTP requests. Please try again later.",
  },
  keyGenerator: (req) => ipKeyGenerator(req.ip || ""),
});

// CRITICAL: Aggressive rate limiting on verification
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 verification attempts per 15 minutes per email
  message: {
    message: "Too many OTP verification attempts. Please try again later",
  },
  keyGenerator: (req) => req.body.email,
  skipFailedRequests: false, // Count all attempts, even failed ones
});

// Per-IP rate limiting (prevent distributed attacks)
const otpVerifyIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Max 15 attempts from same IP
  keyGenerator: (req) => ipKeyGenerator(req.ip || ""),
});

const router = Router();

router.post("/login", authLimiter, validateReqBody(LoginSchema), loginUser);
router.post(
  "/register/dojo-admin",
  authLimiter,
  validateReqBody(RegisterDojoAdminSchema),
  handleRegisterDojoAdmin,
);

router.post(
  "/register/parent",
  authLimiter,
  validateReqBody(RegisterParentSchema),
  handleRegisterParent,
);
router.post("/refresh", validateReqBody(RefreshTokenSchema), refreshUserToken);
router.post("/logout", validateReqBody(RefreshTokenSchema), logoutUser);

router.post("/google", validateReqBody(FirebaseSignInSchema), handleFirebaseLogin);

router.get(
  "/availability/usernames/:username",
  checkAvailabilityRateLimiter,
  handleIsUsernameAvailable,
);

router.get("/availability/dojo-tags/:tag", checkAvailabilityRateLimiter, handleIsDojoTagAvailable);

router.post(
  "/forgot-password",
  otpRequestLimiter,
  otpIpLimiter,
  validateReqBody(ForgotPasswordSchema),
  handleInitForgetPassword,
);

router.post(
  "/verify-otp",
  otpVerifyLimiter,
  otpVerifyIpLimiter,
  validateReqBody(VerifyOtpSchema),
  handleVerifyOtp,
);

router.post("/reset-password", validateReqBody(ResetPasswordSchema), handleResetPassword);

export default router;
