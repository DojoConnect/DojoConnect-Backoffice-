import { Router } from "express";
import { InstructorController } from "../controllers/instructor.controller.js";

const router = Router();

router.get("/invites/:token", InstructorController.fetchInviteDetails);

export default router;
