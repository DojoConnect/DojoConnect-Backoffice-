import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type { MockInstance } from "vitest";
import  {StripeService} from "./stripe.service.js";
import {DojosService} from "./dojos.service.js";
import {UsersService} from "./users.service.js";
import {
  SubscriptionService,
} from "./subscription.service.js";
import { DojoRepository, IDojo } from "../repositories/dojo.repository.js";
import { SubscriptionRepository } from "../repositories/subscription.repository.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../core/errors/index.js";
import {
  BillingStatus,
  DojoStatus,
  StripeSetupIntentStatus,
  StripeSubscriptionStatus,
} from "../constants/enums.js";
import { SubscriptionType } from "../constants/subscription.constants.js";
import { ClassEnrollmentRepository as EnrollmentRepository } from "../repositories/enrollment.repository.js";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import { buildSubscriptionMock } from "../tests/factories/subscription.factory.js";
import { IDojoSub } from "../repositories/subscription.repository.js";
import { IUser } from "../repositories/user.repository.js";
import {
  buildStripeCustMock,
  buildStripeSetupIntentMock,
  buildStripeSubMock,
} from "../tests/factories/stripe.factory.js";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies.js";

describe("SubscriptionService", () => {
  let user: IUser;
  let dojo: IDojo;

  let dbSpies: DbServiceSpies;

  let setupIntentSpy: MockInstance;
  let createCustomerSpy: MockInstance;
  let updateUserSpy: MockInstance;
  let retrieveSetupIntentSpy: MockInstance;
  let createSubscriptionSpy: MockInstance;
  let findLatestDojoAdminSubSpy: MockInstance;
  let createDojoAdminSubSpy: MockInstance;
  let updateDojoAdminSubSpy: MockInstance;
  let updateDojoRepoSpy: MockInstance;
  let getOneDojoByUserIdSpy: MockInstance;
  let updateDojoSpy: MockInstance;

  beforeEach(() => {
    user = buildUserMock();
    dojo = buildDojoMock({ ownerUserId: user.id });

    // Mock runInTransaction to just execute the callback
    dbSpies = createDrizzleDbSpies();

    updateUserSpy = vi.spyOn(UsersService, "updateUser").mockResolvedValue();

    setupIntentSpy = vi.spyOn(StripeService, "setupIntent");
    createCustomerSpy = vi.spyOn(StripeService, "createCustomer");
    retrieveSetupIntentSpy = vi.spyOn(StripeService, "retrieveSetupIntent");
    createSubscriptionSpy = vi.spyOn(StripeService, "createSubscription");

    findLatestDojoAdminSubSpy = vi.spyOn(
      SubscriptionRepository,
      "findLatestDojoAdminSub"
    );
    createDojoAdminSubSpy = vi.spyOn(
      SubscriptionRepository,
      "createDojoAdminSub"
    );
    updateDojoAdminSubSpy = vi.spyOn(
      SubscriptionRepository,
      "updateDojoAdminSub"
    );

    updateDojoRepoSpy = vi.spyOn(DojoRepository, "update");
    getOneDojoByUserIdSpy = vi.spyOn(DojosService, "getOneDojoByUserId");
    updateDojoSpy = vi.spyOn(DojosService, "updateDojo");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrCreateStripeCustId", () => {
    it("should return existing stripeCustomerId if it exists", async () => {
      const stripeCustomerId = "cus_123";
      dojo.stripeCustomerId = stripeCustomerId;

      const result = await SubscriptionService.getOrCreateDojoStripeCustId({
        user,
        dojo,
      });

      expect(result).toBe(stripeCustomerId);
      expect(createCustomerSpy).not.toHaveBeenCalled();
      expect(updateUserSpy).not.toHaveBeenCalled();
    });

    it("should create a new Stripe customer and update the user if stripeCustomerId does not exist", async () => {
      dojo.stripeCustomerId = "";
      const newStripeCustomerId = "cus_new_456";
      const customer = buildStripeCustMock({ id: newStripeCustomerId });
      createCustomerSpy.mockResolvedValue(customer);

      const result = await SubscriptionService.getOrCreateDojoStripeCustId({
        user,
        dojo,
      });

      expect(result).toBe(newStripeCustomerId);
      expect(createCustomerSpy).toHaveBeenCalledWith(user);
      expect(updateDojoSpy).toHaveBeenCalledWith({
        dojoId: dojo.id,
        update: { stripeCustomerId: newStripeCustomerId },
        txInstance: dbSpies.mockTx,
      });
    });
  });

  describe("setupDojoAdminBilling", () => {
    beforeEach(() => {
      dojo.stripeCustomerId = "cus_123";
    });

    it("should throw ConflictException if user does not own dojo", async () => {
      const anotherUser = buildUserMock();
      await expect(
        SubscriptionService.setupDojoAdminBilling({ dojo, user: anotherUser })
      ).rejects.toThrow(ConflictException);
    });

    it("should return existing client_secret if an incomplete setup intent exists", async () => {
      const subscription = buildSubscriptionMock({
        billingStatus: BillingStatus.SetupIntentCreated,
        stripeSetupIntentId: "seti_123",
      });
      const setupIntent = buildStripeSetupIntentMock({
        id: "seti_123",
        status: StripeSetupIntentStatus.RequiresPaymentMethod,
        client_secret: "seti_123_secret",
      });
      findLatestDojoAdminSubSpy.mockResolvedValue(subscription);
      retrieveSetupIntentSpy.mockResolvedValue(setupIntent as any);

      const result = await SubscriptionService.setupDojoAdminBilling({
        dojo,
        user,
      });

      expect(result.clientSecret).toBe(setupIntent.client_secret);
      expect(setupIntentSpy).not.toHaveBeenCalled();
    });

    it("should create a new setup intent if the existing one is canceled", async () => {
      const subscription = buildSubscriptionMock({
        billingStatus: BillingStatus.SetupIntentCreated,
        stripeSetupIntentId: "seti_canceled",
      });
      const canceledSetupIntent = buildStripeSetupIntentMock({
        id: "seti_canceled",
        status: StripeSetupIntentStatus.Canceled,
      });
      const newSetupIntent = buildStripeSetupIntentMock({
        id: "seti_new",
        client_secret: "seti_new_secret",
      });

      findLatestDojoAdminSubSpy.mockResolvedValue(subscription);
      retrieveSetupIntentSpy.mockResolvedValue(canceledSetupIntent);
      setupIntentSpy.mockResolvedValue(newSetupIntent);
      createDojoAdminSubSpy.mockResolvedValue("sub_123");

      const result = await SubscriptionService.setupDojoAdminBilling({
        dojo,
        user,
      });

      expect(retrieveSetupIntentSpy).toHaveBeenCalledWith("seti_canceled");
      expect(setupIntentSpy).toHaveBeenCalledWith(dojo.stripeCustomerId, {
        dojoId: dojo.id,
        ownerUserId: user.id,
        type: SubscriptionType.DojoSub,
      });
      expect(result.clientSecret).toBe(newSetupIntent.client_secret);
    });

    it("should create a new setup intent, subscription, and update dojo", async () => {
      const newSetupIntent = buildStripeSetupIntentMock({
        id: "seti_new_789",
        client_secret: "seti_789_secret",
      });
      findLatestDojoAdminSubSpy.mockResolvedValue(null);
      setupIntentSpy.mockResolvedValue(newSetupIntent);

      const result = await SubscriptionService.setupDojoAdminBilling({
        dojo,
        user,
      });

      expect(result.clientSecret).toBe(newSetupIntent.client_secret);
      expect(setupIntentSpy).toHaveBeenCalledWith(dojo.stripeCustomerId, {
        dojoId: dojo.id,
        ownerUserId: user.id,
        type: SubscriptionType.DojoSub,
      });
      expect(createDojoAdminSubSpy).toHaveBeenCalledWith(
        {
          dojoId: dojo.id,
          stripeSetupIntentId: newSetupIntent.id,
          billingStatus: BillingStatus.SetupIntentCreated,
        },
        dbSpies.mockTx
      );
      expect(updateDojoSpy).toHaveBeenCalledWith({
        dojoId: dojo.id,
        update: {
          status: DojoStatus.OnboardingIncomplete,
        },
        txInstance: dbSpies.mockTx,
      });
    });
  });

  describe("confirmDojoAdminBilling", () => {
    let sub: IDojoSub;

    beforeEach(() => {
      dojo.stripeCustomerId = "cus_123";
      sub = buildSubscriptionMock({
        billingStatus: BillingStatus.SetupIntentCreated,
        stripeSetupIntentId: "seti_123",
      });
      getOneDojoByUserIdSpy.mockResolvedValue(dojo);
      findLatestDojoAdminSubSpy.mockResolvedValue(sub);
    });

    it("should throw NotFoundException if dojo not found", async () => {
      getOneDojoByUserIdSpy.mockResolvedValue(null);
      await expect(
        SubscriptionService.confirmDojoAdminBilling({ user })
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if stripeCustomerId is missing", async () => {
      dojo.stripeCustomerId = "";
      await expect(
        SubscriptionService.confirmDojoAdminBilling({ user })
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if subscription is not found", async () => {
      findLatestDojoAdminSubSpy.mockResolvedValue(null);
      await expect(
        SubscriptionService.confirmDojoAdminBilling({ user })
      ).rejects.toThrow(BadRequestException);
    });

    it("should return early if billing status is not SetupIntentCreated", async () => {
      sub.billingStatus = BillingStatus.Active;
      await SubscriptionService.confirmDojoAdminBilling({ user });
      expect(retrieveSetupIntentSpy).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException if setup intent has not succeeded", async () => {
      const setupIntent = buildStripeSetupIntentMock({
        status: StripeSetupIntentStatus.RequiresPaymentMethod,
      });
      retrieveSetupIntentSpy.mockResolvedValue(setupIntent);
      await expect(
        SubscriptionService.confirmDojoAdminBilling({ user })
      ).rejects.toThrow("Setup not complete");
    });

    it("should create subscription, grant trial, and update statuses", async () => {
      dojo.hasUsedTrial = false;
      const setupIntent = buildStripeSetupIntentMock({
        status: StripeSetupIntentStatus.Succeeded,
        payment_method: "pm_123",
      });
      const stripeSub = buildStripeSubMock({
        id: "sub_123",
        status: StripeSubscriptionStatus.Trialing,
      });
      retrieveSetupIntentSpy.mockResolvedValue(setupIntent);
      createSubscriptionSpy.mockResolvedValue(stripeSub);

      await SubscriptionService.confirmDojoAdminBilling({ user });

      expect(createSubscriptionSpy).toHaveBeenCalledWith({
        custId: dojo.stripeCustomerId,
        plan: dojo.activeSub,
        grantTrial: true,
        paymentMethodId: "pm_123",
        idempotencyKey: `dojo-admin-sub-${sub.id}`,
        metadata: {
          dojoId: dojo.id,
          type: SubscriptionType.DojoSub,
        },
      });
      expect(updateDojoAdminSubSpy).toHaveBeenCalledWith({
        tx: dbSpies.mockTx,
        dojoSubId: sub.id,
        update: {
          stripeSubId: "sub_123",
          stripeSubStatus: StripeSubscriptionStatus.Trialing,
          billingStatus: BillingStatus.Trialing,
        },
      });
      expect(updateDojoRepoSpy).toHaveBeenCalledWith({
        tx: dbSpies.mockTx,
        dojoId: dojo.id,
        update: {
          status: DojoStatus.Trailing,
          hasUsedTrial: true,
        },
      });
    });

    it("should create subscription without trial if already used", async () => {
      dojo.hasUsedTrial = true;
      const setupIntent = buildStripeSetupIntentMock({
        status: StripeSetupIntentStatus.Succeeded,
        payment_method: "pm_123",
      });
      const stripeSub = buildStripeSubMock({
        id: "sub_456",
        status: StripeSubscriptionStatus.Active,
      });
      retrieveSetupIntentSpy.mockResolvedValue(setupIntent);
      createSubscriptionSpy.mockResolvedValue(stripeSub);

      await SubscriptionService.confirmDojoAdminBilling({ user });

      expect(createSubscriptionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          grantTrial: false,
        })
      );
      expect(updateDojoAdminSubSpy).toHaveBeenCalledWith({
        tx: dbSpies.mockTx,
        dojoSubId: sub.id,
        update: {
          stripeSubId: "sub_456",
          stripeSubStatus: StripeSubscriptionStatus.Active,
          billingStatus: BillingStatus.Active,
        },
      });
      expect(updateDojoRepoSpy).toHaveBeenCalledWith({
        tx: dbSpies.mockTx,
        dojoId: dojo.id,
        update: {
          status: DojoStatus.Active,
          hasUsedTrial: true,
        },
      });
    });
  });

  describe("mapStripeSubStatus", () => {
    it('should map "trialing" to BillingStatus.Trialing', () => {
      expect(SubscriptionService.mapStripeSubStatus("trialing")).toBe(
        BillingStatus.Trialing
      );
    });
    it('should map "active" to BillingStatus.Active', () => {
      expect(SubscriptionService.mapStripeSubStatus("active")).toBe(
        BillingStatus.Active
      );
    });
    it('should map "past_due" to BillingStatus.PastDue', () => {
      expect(SubscriptionService.mapStripeSubStatus("past_due")).toBe(
        BillingStatus.PastDue
      );
    });
    it('should map "unpaid" to BillingStatus.PastDue', () => {
      expect(SubscriptionService.mapStripeSubStatus("unpaid")).toBe(
        BillingStatus.PastDue
      );
    });
    it('should map "canceled" to BillingStatus.Cancelled', () => {
      expect(SubscriptionService.mapStripeSubStatus("canceled")).toBe(
        BillingStatus.Cancelled
      );
    });
    it("should throw an error for unhandled status", () => {
      expect(() =>
        SubscriptionService.mapStripeSubStatus("unknown" as any)
      ).toThrow("Unhandled Stripe status: unknown");
    });
  });

  describe("deriveDojoStatus", () => {
    it("should derive Trailing from Trialing", () => {
      expect(SubscriptionService.deriveDojoStatus(BillingStatus.Trialing)).toBe(
        DojoStatus.Trailing
      );
    });
    it("should derive Active from Active", () => {
      expect(SubscriptionService.deriveDojoStatus(BillingStatus.Active)).toBe(
        DojoStatus.Active
      );
    });
    it("should derive PastDue from PastDue", () => {
      expect(SubscriptionService.deriveDojoStatus(BillingStatus.PastDue)).toBe(
        DojoStatus.PastDue
      );
    });
    it("should derive Blocked from Cancelled", () => {
      expect(
        SubscriptionService.deriveDojoStatus(BillingStatus.Cancelled)
      ).toBe(DojoStatus.Blocked);
    });
    it("should derive OnboardingIncomplete from SetupIntentCreated", () => {
      expect(
        SubscriptionService.deriveDojoStatus(BillingStatus.SetupIntentCreated)
      ).toBe(DojoStatus.OnboardingIncomplete);
    });
    it("should derive Registered as default", () => {
      expect(SubscriptionService.deriveDojoStatus("unknown" as any)).toBe(
        DojoStatus.Registered
      );
    });
  });
  describe("createClassSubscriptionsFromPaymentIntent", () => {
    let mockPaymentIntent: any;

    beforeEach(() => {
      mockPaymentIntent = {
        customer: { id: "cus_123" },
        metadata: {
          children_data: JSON.stringify([
            { id: "student_1", name: "Student One" },
            { id: "student_2", name: "Student Two" },
          ]),
          price_id: "price_123",
          class_id: "class_123",
        },
      };

      vi.spyOn(StripeService, "createClassSubscription").mockResolvedValue({
        id: "sub_123",
      } as any);
      vi.spyOn(SubscriptionRepository, "createClassSub").mockResolvedValue({} as any);
      vi.spyOn(
        // @ts-ignore
        EnrollmentRepository,
        "findOneByClassIdAndStudentId"
      ).mockResolvedValue(null);
      vi.spyOn(
        // @ts-ignore
        EnrollmentRepository,
        "create"
      ).mockResolvedValue({} as any);
      vi.spyOn(
        // @ts-ignore
        EnrollmentRepository,
        "update"
      ).mockResolvedValue({} as any);
    });

    it("should throw error if customer is missing", async () => {
        mockPaymentIntent.customer = null;
        await expect(SubscriptionService.createClassSubscriptionsFromPaymentIntent(mockPaymentIntent)).rejects.toThrow("Customer not found in payment intent");
    });

    it("should throw error if metadata is missing fields", async () => {
       mockPaymentIntent.metadata = {};
       await expect(SubscriptionService.createClassSubscriptionsFromPaymentIntent(mockPaymentIntent)).rejects.toThrow("Missing metadata in payment intent");
    });

    it("should create subscriptions and enrollments for all children", async () => {
      await SubscriptionService.createClassSubscriptionsFromPaymentIntent(mockPaymentIntent);

      expect(StripeService.createClassSubscription).toHaveBeenCalledTimes(2);
      expect(SubscriptionRepository.createClassSub).toHaveBeenCalledTimes(2);
      // @ts-ignore
      expect(EnrollmentRepository.create).toHaveBeenCalledTimes(2);
    });

    it("should update enrollment if exists but inactive", async () => {
       vi.spyOn(
        // @ts-ignore
        EnrollmentRepository,
        "findOneByClassIdAndStudentId"
      ).mockResolvedValue({ id: "enroll_1", active: false } as any);

      await SubscriptionService.createClassSubscriptionsFromPaymentIntent(mockPaymentIntent);
       // @ts-ignore
      expect(EnrollmentRepository.update).toHaveBeenCalledTimes(2);
    });
  });
});
