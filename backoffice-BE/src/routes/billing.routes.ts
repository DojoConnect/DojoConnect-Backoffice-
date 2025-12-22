import { Router } from "express";
import { requireRole } from "../middlewares/require-role.middleware.js";
import { Role } from "../constants/enums.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { BillingController } from "../controllers/billing.controller.js";

const router = Router();

router.post(
  "/confirm/dojo-admin",
  requireAuth,
  requireRole(Role.DojoAdmin),
  BillingController.handleConfirmDojoAdminBilling
);

export default router;
