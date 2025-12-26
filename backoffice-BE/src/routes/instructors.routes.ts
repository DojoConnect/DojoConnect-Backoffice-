import { Router } from "express";
import { InstructorController } from "../controllers/instructor.controller.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import { AcceptInviteSchema, DeclineInviteSchema } from "../validations/instructors.schemas.js";

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

export default router;
