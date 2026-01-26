import { Router } from "express";
import { ParentController } from "../controllers/parent.controller.js";
import { Role } from "../constants/enums.js";
import { AddChildSchema } from "../validations/parent.schemas.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { requireRole } from "../middlewares/authorization/require-role.middleware.js";
import { isParentOfChildMiddleware } from "../middlewares/authorization/is-parent.middleware.js";

const router = Router();

// All routes here should be protected and only for Parents
router.use(requireAuth, requireRole(Role.Parent));

router.get("/me/children", ParentController.handleGetChildren);

router.post("/me/children", validateReqBody(AddChildSchema), ParentController.handleAddChild);

router.get("/me/children/classes", ParentController.handleGetChildrenClasses);

router.get(
  "/me/children/:childId/classes",
  isParentOfChildMiddleware,
  ParentController.handleGetChildClasses,
);

export default router;
