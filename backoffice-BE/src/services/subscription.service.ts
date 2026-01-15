import * as dbService from "../db/index.js";
import  {StripeService} from "./stripe.service.js";
import { DojosService} from "./dojos.service.js";
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
import { assertDojoOwnership } from "../utils/assertions.utils.js";

export class SubscriptionService {
  static getOrCreateDojoStripeCustId = async ({
    user,
    dojo,
    txInstance,
  }: {
    user: IUser;
    dojo: IDojo;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      // 1. Ensure Stripe customer exists
      if (dojo.stripeCustomerId) {
        return dojo.stripeCustomerId;
      }

      const customer = await StripeService.createCustomer(
        user
      );

      await DojosService.updateDojo({
        dojoId: dojo.id,
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
      let stripeCustomerId = await this.getOrCreateDojoStripeCustId({
        user,
        dojo,
        txInstance: tx,
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
      const setupIntent = await StripeService.createDojoSubSetupIntent(stripeCustomerId, dojo.id, user.id);

      await SubscriptionRepository.createDojoAdminSub(
        {
          dojoId: dojo.id,
          stripeSetupIntentId: setupIntent.id,
          billingStatus: BillingStatus.SetupIntentCreated,
        },
        tx
      );

      await DojosService.updateDojo({
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
      const dojo = await DojosService.getOneDojoByUserId({
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

      if (!dojo.stripeCustomerId || !sub || !sub.stripeSetupIntentId) {
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

      const stripeSub = await StripeService.createDojoSubscription({
        custId: dojo.stripeCustomerId,
        plan: dojo.activeSub,
        grantTrial,
        paymentMethodId,
        dojoId: dojo.id,
        ownerUserId: user.id,
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
