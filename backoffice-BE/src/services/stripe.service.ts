import Stripe from "stripe";
import AppConfig from "../config/AppConfig.js";
import { StripePlans } from "../constants/enums.js";

export const StripePriceIDsMap = {
  [StripePlans.Monthly]: "price_1Sg2AkRbZzajfaIIlgDhjLfh",
  [StripePlans.Yearly]: "price_1Sg2AkRbZzajfaIInUpYkpcw",
};

type CreateStripeCustRes = Awaited<ReturnType<typeof StripeService.createCustomer>>;
export type StripePaymentMethodRes = Awaited<
  ReturnType<typeof StripeService.retrievePaymentMethod>
>;

// Load stripe key
let stripeInstance: Stripe | null = null;

export class StripeService {
  static getStripeInstance = () => {
    if (!stripeInstance) {
      stripeInstance = new Stripe(AppConfig.STRIPE_SECRET_KEY!);
    }

    return stripeInstance;
  };

  static createCustomer = async (
    name: string,
    email: string,
    metadata: { userId: string; dojoId?: string }
  ) => {
    return await StripeService.getStripeInstance().customers.create({
      name,
      email,
      metadata,
    });
  };

  static setupIntent = async (stripeCustId: string) => {
    return await StripeService.getStripeInstance().setupIntents.create({
      customer: stripeCustId,
      payment_method_types: ["card"],
    });
  };

  static createSubscription = async ({
    custId,
    plan,
    paymentMethodId,
    grantTrial = false,
    idempotencyKey,
  }: {
    custId: string;
    plan: StripePlans;
    paymentMethodId: string;
    grantTrial: boolean;
    idempotencyKey;
  }) => {
    const priceId = StripePriceIDsMap[plan];
    return await StripeService.getStripeInstance().subscriptions.create(
      {
        customer: custId,
        items: [{ price: priceId }],
        trial_period_days: grantTrial ? 14 : undefined,
        default_payment_method: paymentMethodId,
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
      },
      {
        idempotencyKey,
      }
    );
  };

  static retrievePaymentMethod = async (paymentMethod: string) => {
    return await StripeService.getStripeInstance().paymentMethods.retrieve(
      paymentMethod
    );
  };

  static retrieveSetupIntent = async (setupIntentId: string) => {
    return await StripeService.getStripeInstance().setupIntents.retrieve(
      setupIntentId
    );
  };
}

