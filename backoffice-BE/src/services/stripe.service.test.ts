import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MockInstance } from "vitest";
import {StripePriceIDsMap, StripeService} from "./stripe.service.js";
import AppConfig from "../config/AppConfig.js";
import { StripePlans } from "../constants/enums.js";
import {
  buildStripePaymentMethodCardMock,
  buildStripeCustMock,
  buildStripePaymentMethodMock,
} from "../tests/factories/stripe.factory.js";
import { buildUserMock } from "../tests/factories/user.factory.js";

// Mock the entire stripe module
const mockCustomersCreate = vi.fn();
const mockSubscriptionsCreate = vi.fn();
const mockPaymentMethodsRetrieve = vi.fn();

describe("Stripe Service", () => {
  let getStripeInstanceSpy: MockInstance;

  beforeEach(() => {
    // Clear mock history before each test
    vi.clearAllMocks();

    getStripeInstanceSpy = vi
      .spyOn(StripeService, "getStripeInstance")
      .mockReturnValue({
        customers: {
          create: mockCustomersCreate,
        },
        subscriptions: {
          create: mockSubscriptionsCreate,
        },
        paymentMethods: {
          retrieve: mockPaymentMethodsRetrieve,
        },
      } as any);

      AppConfig.STRIPE_SECRET_KEY = "test_stripe_secret_key";
  });

  describe("createCustomers", () => {
    it("should call stripe.customers.create with correct parameters", async () => {
      const user = buildUserMock({ id: "1", firstName: "John", lastName: "Doe", email: "john.doe@example.com" });
      const mockCustomer = buildStripeCustMock({ id: "cus_123", email: user.email });
      mockCustomersCreate.mockResolvedValue(mockCustomer);

      const result = await StripeService.createCustomer(user);

      expect(mockCustomersCreate).toHaveBeenCalledWith({
        name: user.firstName + " " + user.lastName,
        email: user.email,
        metadata: expect.objectContaining({ userId: "1" }),
      });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe("createSubscription", () => {
    it("should call stripe.subscriptions.create with correct parameters for a STARTER plan", async () => {
      const mockCust = buildStripeCustMock({ id: "cus_123" });
      const plan = StripePlans.Monthly;
      const priceId = StripePriceIDsMap[plan];
      const mockSubscription = { id: "sub_123", status: "active" };
      const idempotencyKey = "idempotent-key";
      const paymentMethodId = "test-payment-method-id";

      mockSubscriptionsCreate.mockResolvedValue(mockSubscription);

      const result = await StripeService.createSubscription({
        custId: mockCust.id,
        plan,
        paymentMethodId,
        idempotencyKey,
        grantTrial: true,
      });

      expect(mockSubscriptionsCreate).toHaveBeenCalledWith(
        {
          customer: mockCust.id,
          items: [{ price: priceId }],
          trial_period_days: 14,
          default_payment_method: paymentMethodId,
          payment_behavior: "default_incomplete",
          payment_settings: { save_default_payment_method: "on_subscription" },
        },
        {
          idempotencyKey,
        }
      );

      expect(result).toEqual(mockSubscription);
    });
  });

  describe("retrievePaymentMethod", () => {
    it("should call stripe.paymentMethods.retrieve with the correct payment method ID", async () => {
      const paymentMethodId = "pm_abcdef";
      const mockPaymentMethod = buildStripePaymentMethodMock({
        id: paymentMethodId,
        card: buildStripePaymentMethodCardMock({
          brand: "visa",
          last4: "4242",
        }),
      });

      mockPaymentMethodsRetrieve.mockResolvedValue(mockPaymentMethod);

      const result = await StripeService.retrievePaymentMethod(paymentMethodId);

      expect(mockPaymentMethodsRetrieve).toHaveBeenCalledWith(paymentMethodId);
      expect(result).toEqual(mockPaymentMethod);
    });
  });
});
