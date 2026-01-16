import { NextFunction, Request, Response } from "express";
import { StripeService } from "../services/stripe.service.js";
import { WebhooksService } from "../services/webhooks.service.js";

export class WebhooksController {
    static handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sig = req.headers["stripe-signature"]!;
            const event = StripeService.verifyEventSig(req.body, sig);

            await WebhooksService.processStripeWebhookEvent(event);

            res.status(200).json({ received: true });
        } catch (error) {
            next(error);
        }
    }
}