import { Router } from "express";
import { Role } from "../constants/enums.js";
import { StudentController } from "../controllers/student.controller.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { requireRole } from "../middlewares/authorization/require-role.middleware.js";

const router = Router();

router.get(
  "/classes",
  requireAuth,
  requireRole(Role.Child),
  StudentController.handleGetEnrolledClasses,
);

export default router;
