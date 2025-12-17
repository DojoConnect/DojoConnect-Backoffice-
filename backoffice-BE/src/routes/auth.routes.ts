// Use express-rate-limit
import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import {
  isUsernameAvailable,
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser,
  handleFirebaseLogin,
  handleInitForgetPassword,
  handleVerifyOtp,
  handleResetPassword,
} from "../controllers/auth.controller";
import {
  validateReqBody,
  validateReqQuery,
} from "../middlewares/validate.middleware";
import {
  FirebaseSignInSchema,
  ForgotPasswordSchema,
  IsUsernameAvailableSchema,
  LoginSchema,
  RefreshTokenSchema,
  RegisterUserSchema,
  ResetPasswordSchema,
  VerifyOtpSchema,
} from "../validations/auth.schemas";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    message: "Too many authentication attempts",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const usernameAvailabilityRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    message: "Too many username checks. Please try again in a minute.",
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
  "/register",
  authLimiter,
  validateReqBody(RegisterUserSchema),
  registerUser
);
router.post("/refresh", validateReqBody(RefreshTokenSchema), refreshUserToken);
router.post("/logout", validateReqBody(RefreshTokenSchema), logoutUser);

router.post(
  "/google",
  validateReqBody(FirebaseSignInSchema),
  handleFirebaseLogin
);

router.get(
  "/username/availability",
  usernameAvailabilityRateLimiter,
  validateReqQuery(IsUsernameAvailableSchema),
  isUsernameAvailable
);

router.post(
  "/forgot-password",
  otpRequestLimiter,
  otpIpLimiter,
  validateReqBody(ForgotPasswordSchema),
  handleInitForgetPassword
);

router.post("/verify-otp", otpVerifyLimiter, otpVerifyIpLimiter, validateReqBody(VerifyOtpSchema), handleVerifyOtp);

router.post("/reset-password", validateReqBody(ResetPasswordSchema), handleResetPassword)

export default router;
