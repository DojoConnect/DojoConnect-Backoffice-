import { Router } from "express";
import { UsersController } from "../controllers/users.controller.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import { UpdateProfileSchema } from "../validations/users.schemas.js";

const router = Router();

router.put(
  "/me",
  requireAuth,
  validateReqBody(UpdateProfileSchema),
  UsersController.updateProfile
);

export default router;
