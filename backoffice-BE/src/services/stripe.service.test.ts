import Stripe from "stripe";
import * as stripeService from "./stripe.service";
import AppConfig from "../config/AppConfig";
import { StripePlans } from "../constants/enums";
import {
  buildStripePaymentMethodCardMock,
  buildStripeCustMock,
  buildStripePaymentMethodMock,
} from "../tests/factories/stripe.factory";

// Mock the entire stripe module
const mockCustomersCreate = jest.fn();
const mockSubscriptionsCreate = jest.fn();
const mockPaymentMethodsRetrieve = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => {
    return {
      customers: {
        create: mockCustomersCreate,
      },
      subscriptions: {
        create: mockSubscriptionsCreate,
      },
      paymentMethods: {
        retrieve: mockPaymentMethodsRetrieve,
      },
    };
  });
});

// Mock AppConfig to ensure test keys are used
jest.mock("../config/AppConfig", () => ({
  STRIPE_SECRET_KEY: "test_stripe_secret_key",
}));

const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>;

describe("Stripe Service", () => {
  let getStripeInstanceSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();

    getStripeInstanceSpy = jest
      .spyOn(stripeService, "getStripeInstance")
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

    jest.replaceProperty(
      AppConfig,
      "STRIPE_SECRET_KEY",
      "test_stripe_secret_key"
    );
  });

  describe("createCustomers", () => {
    it("should call stripe.customers.create with correct parameters", async () => {
      const name = "John Doe";
      const email = "john.doe@example.com";
      const paymentMethod = "pm_12345";
      const mockCustomer = buildStripeCustMock({ id: "cus_123", email });
      mockCustomersCreate.mockResolvedValue(mockCustomer);

      const result = await stripeService.createCustomer(
        name,
        email,
        {userId: "1"}
      );

      expect(mockCustomersCreate).toHaveBeenCalledWith({
        name,
        email,
        metadata: expect.objectContaining({userId: "1"})
      });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe("createSubscription", () => {
    it("should call stripe.subscriptions.create with correct parameters for a STARTER plan", async () => {
      const mockCust = buildStripeCustMock({ id: "cus_123" });
      const plan = StripePlans.Monthly;
      const priceId = stripeService.StripePriceIDsMap[plan]
      const mockSubscription = { id: "sub_123", status: "active" };
      const idempotencyKey = "idempotent-key";
      const paymentMethodId = "test-payment-method-id";

      mockSubscriptionsCreate.mockResolvedValue(mockSubscription);

      const result = await stripeService.createSubscription({
        custId: mockCust.id,
        plan,
        paymentMethodId,
        idempotencyKey,
        grantTrial: true
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

      const result = await stripeService.retrievePaymentMethod(paymentMethodId);

      expect(mockPaymentMethodsRetrieve).toHaveBeenCalledWith(paymentMethodId);
      expect(result).toEqual(mockPaymentMethod);
    });
  });
});
