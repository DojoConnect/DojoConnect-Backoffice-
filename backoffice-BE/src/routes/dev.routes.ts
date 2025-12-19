/// Created Just for Dev Purposes. Won't exist in prod

import { Request, Router, Response } from "express";
import AppConfig from "../config/AppConfig";
import { formatApiResponse } from "../utils/api.utils";
import * as usersService from "../services/users.service";
import * as dojosService from "../services/dojos.service";
import * as dbService from "../db";
import { BadRequestException, NotFoundException } from "../core/errors";
import { SubscriptionRepository } from "../repositories/subscription.repository";

const router = Router();

router.get("/stripe/setup-intent", async (req: Request, res: Response) => {
  const stripe = require("stripe")(AppConfig.STRIPE_TEST_SECRET_KEY);

  const { dojoId } = req.body;

  const dojo = await dojosService.getOneDojoByID(dojoId);

  if (!dojo) {
    throw new NotFoundException("Dojo not found");
  }

  let sub = await SubscriptionRepository.findLatestDojoAdminSub(dojo.id, dbService.getDB());

  if (!sub || !sub.stripeSetupIntentId) {
    throw new BadRequestException("No setup in progress");
  }

  const confirmed = await stripe.setupIntents.confirm(sub.stripeSetupIntentId, {
    payment_method: "pm_card_visa",
  });

  return res.json(formatApiResponse({ data: { status: confirmed.status } }));
});

export default router;
