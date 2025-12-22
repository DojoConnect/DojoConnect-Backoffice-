import * as dbService from "../db/index.js";
import  {StripeService} from "./stripe.service.js";
import * as dojosService from "./dojos.service.js";
import {UsersService} from "./users.service.js";
import { ConflictException } from "../core/errors/index.js";
import { DojoRepository, IDojo } from "../repositories/dojo.repository.js";
import { Transaction } from "../db/index.js";
import {
  BillingStatus,
  DojoStatus,
  StripeSetupIntentStatus,
  StripeSubscriptionStatus,
} from "../constants/enums.js";
import { IUser } from "../repositories/user.repository.js";
import { SubscriptionRepository } from "../repositories/subscription.repository.js";
import {
  BadRequestException,
  NotFoundException,
} from "../core/errors/index.js";
import Stripe from "stripe";

export function assertDojoOwnership(dojo: IDojo, user: IUser): asserts dojo {
  if (dojo.userId !== user.id) {
    throw new ConflictException(
      `Dojo ownership mismatch: Dojo ${dojo.userId} does not belong to User ${user.id}`
    );
  }
}

export class SubscriptionService {
  static getOrCreateStripeCustId = async ({
    user,
    txInstance,
    metadata,
  }: {
    user: IUser;
    txInstance?: Transaction;
    metadata?: { dojoId?: string };
  }) => {
    const execute = async (tx: Transaction) => {
      // 1. Ensure Stripe customer exists
      if (user.stripeCustomerId) {
        return user.stripeCustomerId;
      }

      const customer = await StripeService.createCustomer(
        user.name,
        user.email,
        {
          ...metadata,
          userId: user.id,
        }
      );

      await UsersService.updateUser({
        userId: user.id,
        update: {
          stripeCustomerId: customer.id,
        },
        txInstance: tx,
      });

      return customer.id;
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static setupDojoAdminBilling = async ({
    dojo,
    user,
    txInstance,
  }: {
    dojo: IDojo;
    user: IUser;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      // Assert User passed is Dojo Owner
      assertDojoOwnership(dojo, user);

      // 1. Ensure Stripe customer exists
      let stripeCustomerId = await this.getOrCreateStripeCustId({
        user,
        txInstance: tx,
        metadata: { dojoId: dojo.id },
      });

      // 2. Check for existing incomplete setup
      let subscription = await SubscriptionRepository.findLatestDojoAdminSub(
        dojo.id,
        tx
      );

      if (
        subscription &&
        subscription.billingStatus === BillingStatus.SetupIntentCreated &&
        subscription.stripeSetupIntentId
      ) {
        const setupIntent = await StripeService.retrieveSetupIntent(
          subscription.stripeSetupIntentId
        );

        if (setupIntent.status !== StripeSetupIntentStatus.Canceled) {
          return {
            clientSecret: setupIntent.client_secret,
          };
        }
      }

      // 3. Create new SetupIntent
      const setupIntent = await StripeService.setupIntent(stripeCustomerId);

      await SubscriptionRepository.createDojoAdminSub(
        {
          dojoId: dojo.id,
          stripeSetupIntentId: setupIntent.id,
          billingStatus: BillingStatus.SetupIntentCreated,
        },
        tx
      );

      await dojosService.updateDojo({
        dojoId: dojo.id,
        update: {
          status: DojoStatus.OnboardingIncomplete,
        },
        txInstance: tx,
      });

      return {
        clientSecret: setupIntent.client_secret,
      };
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static confirmDojoAdminBilling = async ({
    user,
    txInstance,
  }: {
    user: IUser;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      const dojo = await dojosService.getOneDojoByUserId({
        userId: user.id,
        txInstance: tx,
      });

      if (!dojo) {
        throw new NotFoundException("No dojo found for user");
      }

      let sub = await SubscriptionRepository.findLatestDojoAdminSub(
        dojo.id,
        tx
      );

      if (!user.stripeCustomerId || !sub || !sub.stripeSetupIntentId) {
        throw new BadRequestException("No setup in progress");
      }

      // ✅ State-based idempotency (correct)
      if (sub.billingStatus !== BillingStatus.SetupIntentCreated) {
        return;
      }

      const setupIntent = await StripeService.retrieveSetupIntent(
        sub.stripeSetupIntentId
      );

      if (setupIntent.status !== StripeSetupIntentStatus.Succeeded) {
        throw new BadRequestException("Setup not complete");
      }

      const paymentMethodId = setupIntent.payment_method as string;

      const grantTrial = !dojo.hasUsedTrial;

      const stripeSub = await StripeService.createSubscription({
        custId: user.stripeCustomerId,
        plan: dojo.activeSub,
        grantTrial,
        paymentMethodId,
        idempotencyKey: `dojo-admin-sub-${sub.id}`,
      });

      const billingStatus = this.mapStripeSubStatus(stripeSub.status);
      const dojoStatus = this.deriveDojoStatus(billingStatus);

      await Promise.all([
        SubscriptionRepository.updateDojoAdminSub({
          tx,
          dojoSubId: sub.id,
          update: {
            stripeSubId: stripeSub.id,
            stripeSubStatus: stripeSub.status as StripeSubscriptionStatus,
            billingStatus,
          },
        }),
        DojoRepository.update({
          tx,
          dojoId: dojo.id,
          update: {
            status: dojoStatus,
            hasUsedTrial: true,
          },
        }),
      ]);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static mapStripeSubStatus(
    stripeStatus: Stripe.Subscription.Status
  ): BillingStatus {
    switch (stripeStatus) {
      case "trialing":
        return BillingStatus.Trialing;

      case "active":
        return BillingStatus.Active;

      case "past_due":
      case "unpaid":
      case "paused":
      case "incomplete":
        return BillingStatus.PastDue;

      case "canceled":
      case "incomplete_expired":
        return BillingStatus.Cancelled;

      default:
        throw new Error(`Unhandled Stripe status: ${stripeStatus}`);
    }
  }

  static deriveDojoStatus(billingStatus: BillingStatus): DojoStatus {
    switch (billingStatus) {
      case BillingStatus.Trialing:
        return DojoStatus.Trailing;

      case BillingStatus.Active:
        return DojoStatus.Active;

      case BillingStatus.PastDue:
        return DojoStatus.PastDue;

      case BillingStatus.Cancelled:
        return DojoStatus.Blocked;

      case BillingStatus.SetupIntentCreated:
      case BillingStatus.PaymentMethodAttached:
        return DojoStatus.OnboardingIncomplete;

      default:
        return DojoStatus.Registered;
    }
  }
}
