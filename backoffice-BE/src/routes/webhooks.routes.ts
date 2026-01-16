import { Router } from "express";
import express from "express";
import { WebhooksController } from "../controllers/webhooks.controller.js";

const router = Router();

router.post("/stripe",
    express.raw({ type: "application/json" }),
    WebhooksController.handleStripeWebhook);

export default router;