import Stripe from "stripe";
import AppConfig from "../config/AppConfig.js";
import { ClassFrequency, NodeEnv, StripePlans } from "../constants/enums.js";
import { IUser } from "../repositories/user.repository.js";
import { BadRequestException } from "../core/errors/BadRequestException.js";
import { SubscriptionType } from "../constants/subscription.constants.js";
import { ClassSubStripeMetadata, DojoSubStripeMetadata } from "../types/subscription.types.js";
import { IClass } from "../repositories/class.repository.js";
import { IParent } from "../repositories/parent.repository.js";
import { IStudent } from "../repositories/student.repository.js";
import { getFullName } from "../utils/text.utils.js";

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

  static verifyEventSig = (eventBody: any, signature: string | string[]) => {
    try {
      return StripeService.getStripeInstance().webhooks.constructEvent(
        eventBody,
        signature,
        AppConfig.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      throw new BadRequestException("Invalid webhook signature");
    }
  };

  static createCustomer = async (user: IUser, metadata?: { dojoId?: string }) => {
    return await StripeService.getStripeInstance().customers.create({
      name: getFullName(user.firstName, user.lastName),
      email: user.email,
      metadata: {
        ...metadata,
        userId: user.id,
        userRole: user.role,
      },
    });
  };

  static createDojoSubSetupIntent = async (
    stripeCustId: string,
    dojoId: string,
    ownerUserId: string,
  ) => {
    return await StripeService.setupIntent(stripeCustId, {
      type: SubscriptionType.DojoSub,
      dojoId,
      ownerUserId,
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
    ownerUserId,
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
    };
    return await StripeService.createSubscription({
      custId,
      plan,
      paymentMethodId,
      grantTrial,
      idempotencyKey,
      metadata,
    });
  };

  static createSubscription = async ({
    custId,
    plan,
    paymentMethodId,
    grantTrial = false,
    idempotencyKey,
    metadata,
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
      },
    );
  };

  static retrievePaymentMethod = async (paymentMethod: string) => {
    return await StripeService.getStripeInstance().paymentMethods.retrieve(paymentMethod);
  };

  static retrieveSetupIntent = async (setupIntentId: string) => {
    return await StripeService.getStripeInstance().setupIntents.retrieve(setupIntentId);
  };

  static createClassProduct = async ({
    className,
    dojoId,
    classId,
  }: {
    className: string;
    dojoId: string;
    classId: string;
  }) => {
    return await StripeService.getStripeInstance().products.create({
      name: `DJC-${dojoId}-${className}`,
      metadata: {
        dojoId,
        classId,
      },
    });
  };

  static createClassPrice = async (
    stripeProductId: string,
    price: number,
    frequency: ClassFrequency,
  ) => {
    const params: Stripe.PriceCreateParams = {
      unit_amount: Math.round((price ?? 0) * 100),
      currency: "gbp",
      product: stripeProductId,
    };

    if (frequency === ClassFrequency.Weekly) {
      params.recurring = { interval: "month" };
    }

    return await StripeService.getStripeInstance().prices.create(params);
  };

  static retrievePrice = async (priceId: string) => {
    return await StripeService.getStripeInstance().prices.retrieve(priceId);
  };

  static archivePrice = async (priceId: string) => {
    return await StripeService.getStripeInstance().prices.update(priceId, {
      active: false,
    });
  };

  static createEnrollmentPaymentIntent = async ({
    customerId,
    dojoClass,
    students,
  }: {
    customerId: string;
    dojoClass: IClass;
    students: IStudent[];
  }) => {
    if (!dojoClass.stripePriceId) {
      throw new BadRequestException("Class price not found");
    }

    // Fetch price details to get amount
    const price = await StripeService.retrievePrice(dojoClass.stripePriceId);

    // Calculate Total Amount
    // We assume all students pay the full price for now
    const unitAmount = (price.unit_amount || 0) / 100; // Stripe amounts are in cents
    const totalAmount = unitAmount * students.length;

    const childrenData = students.map((s) => {
      return { id: s.id };
    });

    const metadata = {
      enrollment_type: "dojo_class",
      child_count: students.length,
      price_id: dojoClass.stripePriceId,
      class_id: dojoClass.id,
      children_data: JSON.stringify(childrenData),
    };

    const params: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(totalAmount * 100),
      currency: "gbp",
      customer: customerId,
      metadata,
      setup_future_usage: "off_session",
    };

    if (AppConfig.NODE_ENV === NodeEnv.Development) {
      console.log("Development mode, setting payment method types to card");
      params.payment_method_types = ["card"];
    }

    return await StripeService.getStripeInstance().paymentIntents.create(params);
  };

  static createClassSubscription = async ({
    customerId,
    priceId,
  }: {
    customerId: string;
    priceId: string;
  }) => {
    return await StripeService.getStripeInstance().subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: 30,
      payment_behavior: "default_incomplete",
      // We rely on the customer's default payment method which should be set up by the PI
    });
  };

  static createClassSubCheckOut = async ({
    dojoClass,
    parent,
    students,
  }: {
    dojoClass: IClass;
    parent: IParent;
    students: IStudent[];
  }) => {
    if (!dojoClass.stripePriceId) {
      throw new BadRequestException("Class Stripe price not found");
    }

    const studentIds = students.map((s) => s.id);

    // Limit metadata size if necessary.
    if (studentIds.join(",").length > 500) {
      throw new BadRequestException(
        "Too many students for one checkout session. Please enroll in smaller batches.",
      );
    }

    const metadatas: ClassSubStripeMetadata[] = students.map((student) => ({
      type: SubscriptionType.ClassSub,
      classId: dojoClass.id,
      studentId: student.id,
    }));

    return await StripeService.getStripeInstance().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: parent.stripeCustomerId,
      line_items: metadatas.map((metadata) => ({
        price: dojoClass.stripePriceId!,
        quantity: 1,
        subscription_data: {
          metadata,
        },
      })),
      success_url: `${AppConfig.WEB_URL}/success`,
      cancel_url: `${AppConfig.WEB_URL}/cancel`,
    });
  };
}
