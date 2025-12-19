import { Router } from "express";
import { requireRole } from "../middlewares/require-role.middleware";
import { Role } from "../constants/enums";
import { requireAuth } from "../middlewares/auth.middleware";
import { BillingController } from "../controllers/billing.controller";

const router = Router();

router.post(
  "/confirm/dojo-admin",
  requireAuth,
  requireRole(Role.DojoAdmin),
  BillingController.handleConfirmDojoAdminBilling
);

export default router;
