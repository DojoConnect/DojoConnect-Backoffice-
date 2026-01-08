import { Router } from "express";
import { InstructorController } from "../controllers/instructor.controller.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import {
  AcceptInviteSchema,
  DeclineInviteSchema,
} from "../validations/instructors.schemas.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { requireRole } from "../middlewares/require-role.middleware.js";
import { Role } from "../constants/enums.js";
import { isMemberOfInstructorDojoMiddleware } from "../middlewares/authorization/is-member-of-instructor-dojo.middleware.js";

const router = Router();

router.post(
  "/invites/decline",
  validateReqBody(DeclineInviteSchema),
  InstructorController.handleDeclineInvite
);

router.post(
  "/invites/accept",
  validateReqBody(AcceptInviteSchema),
  InstructorController.handleAcceptInvite
);

router.get("/invites/:token", InstructorController.handleFetchInviteDetails);

router.get(
  "/:instructorId/classes",
  requireAuth,
  requireRole(Role.DojoAdmin, Role.Instructor),    
  isMemberOfInstructorDojoMiddleware,  
  InstructorController.getInstructorClasses
);

export default router;
