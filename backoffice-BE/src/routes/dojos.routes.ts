import { Router } from "express";
import { DojosController } from "../controllers/dojos.controller.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { isDojoOwnerMiddleware } from "../middlewares/authorization/is-dojo-owner.middleware.js";
import { requireRole } from "../middlewares/authorization/require-role.middleware.js";
import { Role } from "../constants/enums.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import { InviteInstructorSchema } from "../validations/instructors.schemas.js";
import { CreateClassSchema } from "../validations/classes.schemas.js";
import { isDojoMemberMiddleware } from "../middlewares/authorization/is-dojo-member.middleware.js";

const router = Router();

router.get("/tag/:tag", DojosController.handleFetchDojoByTag);

router.get(
  "/:dojoId/instructors",
  requireAuth,
  requireRole(Role.DojoAdmin),
  isDojoOwnerMiddleware,
  DojosController.handleFetchDojoInstructors
);

router.get(
  "/:dojoId/instructors/invites",
  requireAuth,
  requireRole(Role.DojoAdmin),
  isDojoOwnerMiddleware,
  DojosController.handleFetchInvitedInstructors
);

router.post(
  "/:dojoId/instructors/invites",
  requireAuth,
  requireRole(Role.DojoAdmin),
  isDojoOwnerMiddleware,
  validateReqBody(InviteInstructorSchema),
  DojosController.handleInviteInstructor
);

router.post(
  "/:dojoId/classes",
  requireAuth,
  requireRole(Role.DojoAdmin),
  isDojoOwnerMiddleware,
  validateReqBody(CreateClassSchema),
  DojosController.createClass
);

router.get(
  "/:dojoId/classes",
  requireAuth,
  isDojoMemberMiddleware,
  DojosController.getClasses
);


export default router;
