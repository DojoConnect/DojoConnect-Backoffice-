import * as dbService from "../db/index.js";
import { StripeService } from "./stripe.service.js";
import { DojosService } from "./dojos.service.js";
import { DojoRepository, IDojo } from "../repositories/dojo.repository.js";
import { Transaction } from "../db/index.js";
import {
  BillingStatus,
  ClassFrequency,
  DojoStatus,
  StripeSetupIntentStatus,
  StripeSubscriptionStatus,
} from "../constants/enums.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { OneTimePaymentRepository } from "../repositories/one-time-payment.repository.js";
import { IUser } from "../repositories/user.repository.js";
import { SubscriptionRepository } from "../repositories/subscription.repository.js";
import { BadRequestException, NotFoundException } from "../core/errors/index.js";
import Stripe from "stripe";
import { assertDojoOwnership } from "../utils/assertions.utils.js";
import { ClassSubStripeMetadata } from "../types/subscription.types.js";
import { ClassEnrollmentRepository as EnrollmentRepository } from "../repositories/enrollment.repository.js";

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

      const customer = await StripeService.createCustomer(user);

      await DojosService.updateDojo({
        dojoId: dojo.id,
        update: {
          stripeCustomerId: customer.id,
        },
        txInstance: tx,
      });

      return customer.id;
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
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
      let subscription = await SubscriptionRepository.findLatestDojoAdminSub(dojo.id, tx);

      if (
        subscription &&
        subscription.billingStatus === BillingStatus.SetupIntentCreated &&
        subscription.stripeSetupIntentId
      ) {
        const setupIntent = await StripeService.retrieveSetupIntent(
          subscription.stripeSetupIntentId,
        );

        if (setupIntent.status !== StripeSetupIntentStatus.Canceled) {
          return {
            clientSecret: setupIntent.client_secret,
          };
        }
      }

      // 3. Create new SetupIntent
      const setupIntent = await StripeService.createDojoSubSetupIntent(
        stripeCustomerId,
        dojo.id,
        user.id,
      );

      await SubscriptionRepository.createDojoAdminSub(
        {
          dojoId: dojo.id,
          stripeSetupIntentId: setupIntent.id,
          billingStatus: BillingStatus.SetupIntentCreated,
        },
        tx,
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

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
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

      let sub = await SubscriptionRepository.findLatestDojoAdminSub(dojo.id, tx);

      if (!dojo.stripeCustomerId || !sub || !sub.stripeSetupIntentId) {
        throw new BadRequestException("No setup in progress");
      }

      // ✅ State-based idempotency (correct)
      if (sub.billingStatus !== BillingStatus.SetupIntentCreated) {
        return;
      }

      const setupIntent = await StripeService.retrieveSetupIntent(sub.stripeSetupIntentId);

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

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  static mapStripeSubStatus(stripeStatus: Stripe.Subscription.Status): BillingStatus {
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

  static handleClassSubPaid = async (
    session: Stripe.Checkout.Session,
    metadata: ClassSubStripeMetadata,
    tx: Transaction,
  ) => {
    if (!session.subscription) {
      throw new BadRequestException("Subscription not found");
    }

    if (!session.customer) {
      throw new BadRequestException("Customer not found");
    }

    /**
     * Why trialing?
     * Stripe may still attempt first invoice
     * Final state comes from subscription events
     */
    await SubscriptionRepository.createClassSub(
      {
        classId: metadata.classId,
        studentId: metadata.studentId,
        stripeCustomerId:
          typeof session.customer === "string" ? session.customer : session.customer.id,
        stripeSubId:
          typeof session.subscription === "string" ? session.subscription : session.subscription.id,
        status: BillingStatus.Trialing,
      },
      tx,
    );

    // Create Enrollment if not exists
    const existingEnrollment = await EnrollmentRepository.findOneByClassIdAndStudentId(
      metadata.classId,
      metadata.studentId,
      tx,
    );

    if (!existingEnrollment) {
      await EnrollmentRepository.create(
        {
          classId: metadata.classId,
          studentId: metadata.studentId,
          active: true,
        },
        tx,
      );

      return;
    }

    if (!existingEnrollment.active) {
      await EnrollmentRepository.update({
        classEnrollmentId: existingEnrollment.id,
        update: { active: true },
        tx,
      });
    }
  };

  static syncClassSub = async (subscription: Stripe.Subscription, tx: Transaction) => {
    const status = this.mapStripeSubStatus(subscription.status);
    let endedAt: Date | null = null;
    if (status === BillingStatus.Cancelled) {
      if (!subscription.canceled_at) {
        throw new BadRequestException("Subscription canceled at not found");
      }
      endedAt = new Date(subscription.canceled_at * 1000);
    }

    await SubscriptionRepository.updateClassSubByStripeSubId({
      stripeSubId: subscription.id,
      update: {
        status,
        endedAt: endedAt,
      },
      tx,
    });
  };

  static markClassSubPastDue = async (subId: string, tx: Transaction) => {
    await SubscriptionRepository.updateClassSubByStripeSubId({
      stripeSubId: subId,
      update: {
        status: BillingStatus.PastDue,
      },
      tx,
    });
  };

  static markClassSubActive = async (subId: string, tx: Transaction) => {
    await SubscriptionRepository.updateClassSubByStripeSubId({
      stripeSubId: subId,
      update: {
        status: BillingStatus.Active,
      },
      tx,
    });
  };

  static markClassSubCancelled = async (subscription: Stripe.Subscription, tx: Transaction) => {
    const status = this.mapStripeSubStatus(subscription.status);

    if (status !== BillingStatus.Cancelled) {
      return;
    }

    const classSub = await SubscriptionRepository.findOneClassSubByStripeSubId(subscription.id, tx);

    if (!classSub) {
      throw new BadRequestException("Class subscription not found");
    }

    await Promise.all([
      SubscriptionRepository.updateClassSubByStripeSubId({
        stripeSubId: subscription.id,
        update: {
          status,
        },
        tx,
      }),
      EnrollmentRepository.updateByClassIdAndStudentId({
        classId: classSub.classId,
        studentId: classSub.studentId,
        update: {
          active: false,
          revokedAt: new Date(),
        },
        tx,
      }),
    ]);
  };

  static createClassSubscriptionsFromPaymentIntent = async (
    paymentIntent: Stripe.PaymentIntent,
    txInstance?: Transaction,
  ) => {
    const execute = async (tx: Transaction) => {
      const { customer, metadata } = paymentIntent;
      if (!customer) {
        throw new BadRequestException("Customer not found in payment intent");
      }
      if (!metadata.children_data || !metadata.price_id || !metadata.class_id) {
        throw new BadRequestException("Missing metadata in payment intent");
      }

      const childrenData = JSON.parse(metadata.children_data) as { id: string }[];
      const priceId = metadata.price_id;
      const classId = metadata.class_id;
      const customerId = typeof customer === "string" ? customer : customer.id;

      const dojoClass = await ClassRepository.findById(classId, tx);
      if (!dojoClass) {
        throw new NotFoundException("Class not found");
      }

      for (const child of childrenData) {
        if (dojoClass.frequency === ClassFrequency.Weekly) {
          // 1. Create Stripe Subscription
          const subscription = await StripeService.createClassSubscription({
            customerId,
            priceId,
          });

          // 2. Create Class Subscription Record
          await SubscriptionRepository.createClassSub(
            {
              classId,
              studentId: child.id,
              stripeCustomerId: customerId,
              stripeSubId: subscription.id,
              status: BillingStatus.Active,
            },
            tx,
          );
        } else if (dojoClass.frequency === ClassFrequency.OneTime) {
          // One-Time Class
          await OneTimePaymentRepository.create(
            {
              classId,
              studentId: child.id,
              stripePaymentIntentId: paymentIntent.id,
              amount: (paymentIntent.amount / 100).toString(),
              status: BillingStatus.Active,
              paidAt: new Date(),
            },
            tx,
          );
        }

        // 3. Create/Update Enrollment
        const existingEnrollment = await EnrollmentRepository.findOneByClassIdAndStudentId(
          classId,
          child.id,
          tx,
        );

        if (!existingEnrollment) {
          await EnrollmentRepository.create(
            {
              classId,
              studentId: child.id,
              active: true,
            },
            tx,
          );
        } else if (!existingEnrollment.active) {
          await EnrollmentRepository.update({
            classEnrollmentId: existingEnrollment.id,
            update: { active: true },
            tx,
          });
        }
      }
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };
}
