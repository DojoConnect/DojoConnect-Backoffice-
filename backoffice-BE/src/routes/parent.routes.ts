import { Router } from "express";
import { handleAddChild, handleGetChildren } from "../controllers/parent.controller.js";
import { Role } from "../constants/enums.js";
import { AddChildSchema } from "../validations/parent.schemas.js";
import { validateReqBody } from "../middlewares/validate.middleware.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";
import { requireRole } from "../middlewares/authorization/require-role.middleware.js";

const router = Router();

// All routes here should be protected and only for Parents
router.use(requireAuth, requireRole(Role.Parent));

router.get("/children", handleGetChildren);

router.post(
  "/children",
  validateReqBody(AddChildSchema),
  handleAddChild
);

export default router;
