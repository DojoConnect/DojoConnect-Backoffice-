// Use express-rate-limit
import { Router } from "express";
import rateLimit from "express-rate-limit";

import { loginUser, registerUser } from "../controllers/auth.controller";
import { validateReqBody } from "../middlewares/validate.middleware";
import { LoginSchema, RegisterUserSchema } from "../validations/auth.schemas";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many authentication attempts",
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
router.post("/refresh", authLimiter);
router.post("/logout");

export default router;
