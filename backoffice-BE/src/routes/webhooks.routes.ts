import { Router } from "express";
import { WebhooksController } from "../controllers/webhooks.controller.js";

const router = Router();

router.post("/stripe", WebhooksController.handleStripeWebhook);

export default router;