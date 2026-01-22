import Stripe from "stripe";
import * as dbService from "../db/index.js";
import { StripeWebhookEventsRepository } from "../repositories/stripe-webhook-events.repository.js";
import { Transaction } from "../db/index.js";
import { StripeMetadata } from "../types/subscription.types.js";
import { StripeWebhookEvents, SubscriptionType } from "../constants/subscription.constants.js";
import { SubscriptionService } from "./subscription.service.js";
import { BadRequestException } from "../core/errors/BadRequestException.js";
import { isString } from "../utils/type-guards.utils.js";

export class WebhooksService {
  static processStripeWebhookEvent = async (event: Stripe.Event, txInstance?: Transaction) => {
    const execute = async (tx: Transaction) => {
      const alreadyProcessed = await StripeWebhookEventsRepository.getOneByID(event.id, tx);
      if (alreadyProcessed) {
        return;
      }

      await WebhooksService.handleStripeEvent(event, tx);
      await StripeWebhookEventsRepository.create({ id: event.id, type: event.type }, tx);
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static handleStripeEvent = async (event: Stripe.Event, tx: Transaction) => {
    switch (event.type) {
      case StripeWebhookEvents.CheckoutSessionCompleted:
        WebhooksService.handleCheckoutCompleted(event.data.object, tx);
        break;

      case StripeWebhookEvents.CustomerSubscriptionCreated:
      case StripeWebhookEvents.CustomerSubscriptionUpdated:
        WebhooksService.handleSubscriptionUpdate(event.data.object, tx);
        break;

      case StripeWebhookEvents.InvoicePaid:
        WebhooksService.handleInvoicePaid(event.data.object, tx);
        break;
      case StripeWebhookEvents.InvoicePaymentFailed:
        WebhooksService.handleInvoiceFailed(event.data.object, tx);
        break;

      case StripeWebhookEvents.CustomerSubscriptionDeleted:
        WebhooksService.handleSubscriptionCancelled(event.data.object, tx);
        break;

      case StripeWebhookEvents.PaymentIntentSucceeded:
        WebhooksService.handlePaymentIntentSucceeded(event.data.object, tx);
        break;
      case StripeWebhookEvents.SetupIntentSucceeded:
        WebhooksService.handleSetupIntentSucceeded(event.data.object, tx);
        break;
    }
  };

  static handleCheckoutCompleted = (session: Stripe.Checkout.Session, tx: Transaction) => {
    if (!session.metadata) {
      throw new Error("No metadata found in checkout session");
    }

    const metadata = session.metadata as StripeMetadata;

    switch (metadata.type) {
      case SubscriptionType.ClassSub:
      case SubscriptionType.OneTimeClass:
      case SubscriptionType.DojoSub:
        // TODO: Handle dojo subscription and One Time classes
        break;
      default:
        throw new Error("Invalid subscription type");
    }
  };

  static handleSubscriptionUpdate = (subscription: Stripe.Subscription, tx: Transaction) => {
    if (!subscription.metadata) {
      throw new Error("No metadata found in subscription");
    }

    const metadata = subscription.metadata as StripeMetadata;

    switch (metadata.type) {
      case SubscriptionType.ClassSub:
        SubscriptionService.syncClassSub(subscription, tx);
        break;
      case SubscriptionType.OneTimeClass:
      case SubscriptionType.DojoSub:
        // TODO: Handle dojo subscription and One Time classes
        break;
      default:
        throw new Error("Invalid subscription type");
    }
  };

  static handleInvoiceFailed = (invoice: Stripe.Invoice, tx: Transaction) => {
    const subscription = invoice.parent?.subscription_details?.subscription;
    if (!subscription) {
      throw new Error("No subscription found in invoice");
    }

    const subId = isString(subscription) ? subscription : subscription.id;
    const subscriptionMetadata = this.getSubscriptionMetadataFromInvoice(invoice);

    if (!subscriptionMetadata) {
      throw new Error("No metadata found in subscription");
    }

    switch (subscriptionMetadata.type) {
      case SubscriptionType.ClassSub:
        SubscriptionService.markClassSubPastDue(subId, tx);
        break;
      case SubscriptionType.OneTimeClass:
      case SubscriptionType.DojoSub:
        // TODO: Handle dojo subscription and One Time classes
        break;
      default:
        throw new Error("Invalid subscription type");
    }
  };

  static getSubscriptionMetadataFromInvoice = (invoice: Stripe.Invoice) => {
    const subscriptionDetails = invoice.parent?.subscription_details;

    if (!subscriptionDetails) {
      throw new BadRequestException("No subscription details found in invoice");
    }

    if (subscriptionDetails.metadata) {
      return subscriptionDetails.metadata as StripeMetadata;
    }

    const subscription = subscriptionDetails?.subscription;

    if (!subscription) {
      throw new BadRequestException("No subscription found in invoice");
    }

    const subscriptionMetadata =
      !isString(subscription) ? subscription.metadata : invoice.metadata;

    if (!subscriptionMetadata) {
      throw new BadRequestException("No metadata found in invoice");
    }

    return subscriptionMetadata as StripeMetadata;
  };

  static handleInvoicePaid = (invoice: Stripe.Invoice, tx: Transaction) => {
    const subscriptionDetails = invoice.parent?.subscription_details;
    const subscription = subscriptionDetails?.subscription;

    if (!subscription) {
      throw new Error("No subscription found in invoice");
    }

    const subId = isString(subscription) ? subscription : subscription.id;

    const subscriptionMetadata = this.getSubscriptionMetadataFromInvoice(invoice);

    if (!subscriptionMetadata) {
      throw new Error("No metadata found in subscription");
    }

    switch (subscriptionMetadata.type) {
      case SubscriptionType.ClassSub:
        SubscriptionService.markClassSubActive(subId, tx);
        break;
      case SubscriptionType.OneTimeClass:
      case SubscriptionType.DojoSub:
        // TODO: Handle dojo subscription and One Time classes
        break;
      default:
        throw new Error("Invalid subscription type");
    }
  };

  static handlePaymentIntentSucceeded = async (
    paymentIntent: Stripe.PaymentIntent,
    tx: Transaction,
  ) => {
    if (paymentIntent.metadata && paymentIntent.metadata.enrollment_type === "dojo_class") {
      await SubscriptionService.createClassSubscriptionsFromPaymentIntent(paymentIntent, tx);
    }
  };

  static handleSubscriptionCancelled = (subscription: Stripe.Subscription, tx: Transaction) => {
    if (!subscription.metadata) {
      throw new Error("No metadata found in subscription");
    }

    const metadata = subscription.metadata as StripeMetadata;

    switch (metadata.type) {
      case SubscriptionType.ClassSub:
        SubscriptionService.markClassSubCancelled(subscription, tx);
        break;
      case SubscriptionType.OneTimeClass:
      case SubscriptionType.DojoSub:
        // TODO: Handle dojo subscription and One Time classes
        break;
      default:
        throw new Error("Invalid subscription type");
    }
  };

  static handleOneTimePayment = (event: Stripe.Event, tx: Transaction) => {};

  static handleSetupIntentSucceeded = async (
    setupIntent: Stripe.SetupIntent,
    tx: Transaction,
  ) => {
    if (!setupIntent.metadata) {
      throw new Error("No metadata found in setup intent");
    }

    const metadata = setupIntent.metadata as any as StripeMetadata;

    switch (metadata.type) {
      case SubscriptionType.DojoSub:
        await SubscriptionService.handleDojoAdminSetupIntentSucceeded(setupIntent, tx);
        break;
    }
  };
}
