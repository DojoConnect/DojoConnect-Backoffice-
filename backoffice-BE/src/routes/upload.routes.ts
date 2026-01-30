import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { UploadController } from "../controllers/upload.controller.js";
import { requireRole } from "../middlewares/authorization/require-role.middleware.js";
import { Role } from "../constants/enums.js";

const router = Router({ mergeParams: true });

router.post(
  "/image/signature/class",
  requireAuth,
  requireRole(Role.DojoAdmin),
  UploadController.handleGenerateClassImageUploadSignature,
);

router.post(
  "/image/signature/avatar",
  requireAuth,
  UploadController.handleGenerateProfileImageUploadSignature,
);

export default router;
