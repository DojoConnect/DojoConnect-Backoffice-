import { Router } from "express";
import { UsersController } from "../controllers/users.controller.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import { UpdateProfileImageSchema, UpdateProfileSchema } from "../validations/users.schemas.js";

const router = Router();

router.get("/me", requireAuth, UsersController.getProfile);

router.patch(
  "/me",
  requireAuth,
  validateReqBody(UpdateProfileSchema),
  UsersController.updateProfile
);

router.patch(
  "/me/avatar",
  requireAuth,
  validateReqBody(UpdateProfileImageSchema),
  UsersController.updateProfileImage,
);

export default router;
