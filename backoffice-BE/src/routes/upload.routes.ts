import { Router } from "express";
import { GetCloudinarySignatureSchema } from "../validations/upload.schemas.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import { isDojoMemberMiddleware } from "../middlewares/authorization/is-dojo-member.middleware.js";
import { UploadController } from "../controllers/upload.controller.js";

const router = Router({ mergeParams: true });

router.post(
  "/image/signature",
  requireAuth,
  isDojoMemberMiddleware,
  validateReqBody(GetCloudinarySignatureSchema),
  UploadController.handleGetCloudinarySignature,
);

export default router;
