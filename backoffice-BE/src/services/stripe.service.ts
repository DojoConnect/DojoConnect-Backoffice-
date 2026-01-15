import Stripe from "stripe";
import AppConfig from "../config/AppConfig.js";
import { StripePlans } from "../constants/enums.js";
import { IUser } from "../repositories/user.repository.js";

export const StripePriceIDsMap = {
  [StripePlans.Monthly]: "price_1Sg2AkRbZzajfaIIlgDhjLfh",
  [StripePlans.Yearly]: "price_1Sg2AkRbZzajfaIInUpYkpcw",
};

type CreateStripeCustRes = Awaited<
  ReturnType<typeof StripeService.createCustomer>
>;
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
    user: IUser,
    metadata?: { dojoId?: string }
  ) => {
    return await StripeService.getStripeInstance().customers.create({
      name: `${user.firstName} ${user.lastName || ""}`.trim(),
      email: user.email,
      metadata: {
        ...metadata,
        userId: user.id,
        userRole: user.role,
      },
    });
  };

  static setupIntent = async (stripeCustId: string, metadata?: Stripe.MetadataParam) => {
    return await StripeService.getStripeInstance().setupIntents.create({
      customer: stripeCustId,
      payment_method_types: ["card"],
      metadata,
    });
  };

  static createDojoSubscription = async ({
    custId,
    plan,
    paymentMethodId,
    grantTrial = false,
    idempotencyKey,
    dojoId,
    ownerUserId
  }: {
    custId: string;
    plan: StripePlans;
    paymentMethodId: string;
    grantTrial: boolean;
    idempotencyKey;
    dojoId: string;
    ownerUserId: string;
  }) => {
    const metadata: DojoSubStripeMetadata = {
      type: SubscriptionType.DojoSub,
      dojoId,
    }
    return await StripeService.createSubscription({
      custId,
      plan,
      paymentMethodId,
      grantTrial,
      idempotencyKey,
      metadata
    });
  };

  static createSubscription = async ({
    custId,
    plan,
    paymentMethodId,
    grantTrial = false,
    idempotencyKey,
    metadata
  }: {
    custId: string;
    plan: StripePlans;
    paymentMethodId: string;
    grantTrial: boolean;
    idempotencyKey;
    metadata?: Stripe.MetadataParam;
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
        metadata,
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

  static createClassProduct = async ({className, dojoId, classId}: {className: string, dojoId: string, classId: string}) => {
    return await StripeService.getStripeInstance().products.create({
      name: `DJC-${dojoId}-${className}`,
      metadata: {
        dojoId,
        classId
      },
    });
  };

  static createClassPrice = async (stripeProductId: string, price: number) => {
    return await StripeService.getStripeInstance().prices.create({
      unit_amount: Math.round((price ?? 0) * 100),
      currency: "gbp",
      recurring: { interval: "month" },
      product: stripeProductId,
    });
  };

  static retrievePrice = async (priceId: string) => {
    return await StripeService.getStripeInstance().prices.retrieve(priceId);
  };

  static archivePrice = async (priceId: string) => {
    return await StripeService.getStripeInstance().prices.update(priceId, {
      active: false,
    });
  };
}
