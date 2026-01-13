import { Router } from "express";
import { requireRole } from "../middlewares/authorization/require-role.middleware.js";
import { Role } from "../constants/enums.js";
import { BillingController } from "../controllers/billing.controller.js";
import { requireAuth } from "../middlewares/require-auth.middleware.js";

const router = Router();

router.post(
  "/confirm/dojo-admin",
  requireAuth,
  requireRole(Role.DojoAdmin),
  BillingController.handleConfirmDojoAdminBilling
);

export default router;
