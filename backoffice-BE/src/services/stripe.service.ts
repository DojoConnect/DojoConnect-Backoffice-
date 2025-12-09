import Stripe from "stripe";
import AppConfig from "../config/AppConfig";
import { StripePlans } from "../constants/enums";

const StripePriceIDs = {
  STARTER: "price_1S60ItDeXOegqDFkUiHdCJL3",
  PRO: "price_1S60JKDeXOegqDFkO3Wjy2eg",
  TRIAL: "price_1S60ItDeXOegqDFkUiHdCJL3",
};

type CreateStripeCustRes = Awaited<ReturnType<typeof createCustomers>>;
export type StripePaymentMethodRes = Awaited<ReturnType<typeof retrievePaymentMethod>>;


// Load stripe key
let stripeInstance: Stripe | null = null;

export const getStripeInstance = () => {
  if (stripeInstance) {
    return stripeInstance;
  }

  stripeInstance = new Stripe(AppConfig.STRIPE_SECRET_KEY!);

  return stripeInstance;
};

export const createCustomers = async (
  name: string,
  email: string,
  paymentMethod: string
) => {
  return await getStripeInstance().customers.create({
    name,
    email,
    payment_method: paymentMethod,
    invoice_settings: { default_payment_method: paymentMethod },
  });
};

export const createSubscription = async (cust: CreateStripeCustRes, plan: StripePlans) => {
    return await getStripeInstance().subscriptions.create({
      customer: cust.id,
      items: [{ price: StripePriceIDs[plan] }],
      trial_period_days: 14,
      expand: ["latest_invoice.payment_intent"],
    });
}

export const retrievePaymentMethod = async (paymentMethod: string) => {
    return await getStripeInstance().paymentMethods.retrieve(paymentMethod);
}
