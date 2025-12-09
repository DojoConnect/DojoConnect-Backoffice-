/// Created Just for Dev Purposes. Won't exist in prod

import { Request, Router, Response } from "express";
import AppConfig from "../config/AppConfig";
import { formatApiResponse } from "../utils/api.utils";

const router = Router();

router.get("/stripe/payment-intent", async (req: Request, res: Response) => {
  const stripe = require("stripe")(AppConfig.STRIPE_TEST_SECRET_KEY);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 500,
    currency: "gbp",
    payment_method: "pm_card_visa",
    setup_future_usage: "off_session",
    payment_method_types: ["card"],
  });

  return res.json(formatApiResponse({ data: { paymentIntent } }));
});

export default router;
