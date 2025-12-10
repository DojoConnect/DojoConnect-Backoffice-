// Use express-rate-limit
import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  isUsernameAvailable,
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser,
} from "../controllers/auth.controller";
import {
  validateReqBody,
  validateReqQuery,
} from "../middlewares/validate.middleware";
import {
  IsUsernameAvailableSchema,
  LoginSchema,
  RefreshTokenSchema,
  RegisterUserSchema,
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

router.get(
  "/username/availability",
  usernameAvailabilityRateLimiter,
  validateReqQuery(IsUsernameAvailableSchema),
  isUsernameAvailable
);

export default router;
