import Stripe from "stripe";
import AppConfig from "../config/AppConfig";
import { StripePlans } from "../constants/enums";

export const StripePriceIDsMap = {
  [StripePlans.Monthly]: "price_1Sg2AkRbZzajfaIIlgDhjLfh",
  [StripePlans.Yearly]: "price_1Sg2AkRbZzajfaIInUpYkpcw",
};

type CreateStripeCustRes = Awaited<ReturnType<typeof createCustomer>>;
export type StripePaymentMethodRes = Awaited<
  ReturnType<typeof retrievePaymentMethod>
>;

// Load stripe key
let stripeInstance: Stripe | null = null;

export const getStripeInstance = () => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(AppConfig.STRIPE_SECRET_KEY!);
  }

  return stripeInstance;
};

export const createCustomer = async (
  name: string,
  email: string,
  metadata: { userId: string; dojoId?: string }
) => {
  return await getStripeInstance().customers.create({
    name,
    email,
    metadata,
  });
};

export const setupIntent = async (stripeCustId: string) => {
  return await getStripeInstance().setupIntents.create({
    customer: stripeCustId,
    payment_method_types: ["card"],
  });
};

export const createSubscription = async ({
  custId,
  plan,
  paymentMethodId,
  grantTrial= false,
  idempotencyKey
}: {
  custId: string;
  plan: StripePlans;
  paymentMethodId: string;
  grantTrial: boolean;
  idempotencyKey
}) => {
  const priceId = StripePriceIDsMap[plan];
  return await getStripeInstance().subscriptions.create(
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

export const retrievePaymentMethod = async (paymentMethod: string) => {
  return await getStripeInstance().paymentMethods.retrieve(paymentMethod);
};


export const retrieveSetupIntent = async (setupIntentId: string) => {
  return await getStripeInstance().setupIntents.retrieve(setupIntentId);
}