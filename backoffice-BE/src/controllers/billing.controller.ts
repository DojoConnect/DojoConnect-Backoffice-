import { Request, Response } from "express";
import { SubscriptionService } from "../services/subscription.service.js";
import { formatApiResponse } from "../utils/api.utils.js";

export class BillingController {
  static async handleConfirmDojoAdminBilling(req: Request, res: Response) {
    await SubscriptionService.confirmDojoAdminBilling({ user: req.user! });

    res.status(200).json(
      formatApiResponse({
        data: undefined,
        message: "Successful",
      })
    );
  }
}
