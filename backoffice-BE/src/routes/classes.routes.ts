import { Router } from "express";
import { ClassesController } from "../controllers/classes.controller.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { requireRole } from "../middlewares/authorization/require-role.middleware.js";
import { Role } from "../constants/enums.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import {
  UpdateClassInstructorSchema,
  UpdateClassSchema,
} from "../validations/classes.schemas.js";
import { isClassDojoOwnerMiddleware } from "../middlewares/authorization/is-dojo-owner.middleware.js";

const router = Router({ mergeParams: true });

router.get(
  "/:classId",
  ClassesController.getClassById
);

router.patch(
  "/:classId",
  requireAuth,
  requireRole(Role.DojoAdmin),
  isClassDojoOwnerMiddleware,
  validateReqBody(UpdateClassSchema),
  ClassesController.updateClass
);

router.patch(
  "/:classId/instructor",
  requireAuth,
  requireRole(Role.DojoAdmin),
  isClassDojoOwnerMiddleware,
  validateReqBody(UpdateClassInstructorSchema),
  ClassesController.updateClassInstructor
);

export default router;