import { Router } from "express";
import { ClassesController } from "../controllers/classes.controller.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { requireRole } from "../middlewares/authorization/require-role.middleware.js";
import { Role } from "../constants/enums.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import { UpdateClassInstructorSchema, UpdateClassSchema } from "../validations/classes.schemas.js";
import { isClassDojoOwnerMiddleware } from "../middlewares/authorization/is-dojo-owner.middleware.js";
import { EnrollmentController } from "../controllers/enrollment.controller.js";
import { EnrollStudentSchema } from "../validations/classes.schemas.js";
import { isParentOfStudentMiddleware } from "../middlewares/authorization/is-parent-of-student.middleware.js";
import { isClassInstructorOrDojoOwnerMiddleware } from "../middlewares/authorization/is-class-instructor-or-dojo-owner.middleware.js";
import { isClassMemberMiddleware } from "../middlewares/authorization/is-class-member.middleware.js";
import { MessageController } from "../controllers/message.controller.js";
import { SendMessageSchema, GetMessagesQuerySchema } from "../validations/message.schemas.js";
import { validateReqQuery } from "../middlewares/validate.middleware.js";

const router = Router({ mergeParams: true });

router.get("/:classId", requireAuth, ClassesController.getClassById);

router.get("/:classId/view", ClassesController.getClassById);

router.get(
  "/:classId/students",
  requireAuth,
  isClassInstructorOrDojoOwnerMiddleware,
  ClassesController.handleGetClassStudents,
);

router.patch(
  "/:classId",
  requireAuth,
  requireRole(Role.DojoAdmin),
  isClassDojoOwnerMiddleware,
  validateReqBody(UpdateClassSchema),
  ClassesController.updateClass,
);

router.patch(
  "/:classId/instructor",
  requireAuth,
  requireRole(Role.DojoAdmin),
  isClassDojoOwnerMiddleware,
  validateReqBody(UpdateClassInstructorSchema),
  ClassesController.updateClassInstructor,
);

router.post(
  "/:classId/enroll",
  requireAuth,
  requireRole(Role.Parent),
  isParentOfStudentMiddleware,
  validateReqBody(EnrollStudentSchema),
  EnrollmentController.enrollStudent,
);

router.post(
  "/:classId/messages",
  requireAuth,
  isClassMemberMiddleware,
  validateReqBody(SendMessageSchema),
  MessageController.sendMessage,
);

router.get(
  "/:classId/messages",
  requireAuth,
  isClassMemberMiddleware,
  validateReqQuery(GetMessagesQuerySchema),
  MessageController.getMessages,
);

export default router;
