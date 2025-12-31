import { Router } from "express";
import { ClassesController } from "../controllers/classes.controller.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { requireRole } from "../middlewares/require-role.middleware.js";
import { Role } from "../constants/enums.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import { CreateClassSchema } from "../validations/classes.schemas.js";
import { isDojoOwnerMiddleware } from "../middlewares/is-dojo-owner.middleware.js";
import { isDojoMemberMiddleware } from "../middlewares/is-dojo-member.middleware.js";

const router = Router({ mergeParams: true });

router.post(
  "/",
  requireAuth,
  requireRole(Role.DojoAdmin),
  isDojoOwnerMiddleware,
  validateReqBody(CreateClassSchema),
  ClassesController.createClass
);

router.get(
  "/",
  requireAuth,
  isDojoMemberMiddleware,
  ClassesController.getClasses
);

router.get(
  "/:classId",
  requireAuth,
  isDojoMemberMiddleware,
  ClassesController.getClassById
);

export default router;