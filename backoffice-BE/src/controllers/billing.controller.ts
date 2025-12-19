import { Request, Response } from "express";
import { SubscriptionService } from "../services/subscription.service";
import { formatApiResponse } from "../utils/api.utils";

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
