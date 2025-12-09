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

const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>;

describe("Stripe Service", () => {
  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();
    // Reset the singleton instance for testing initialization
    (stripeService as any).stripeInstance = null;

    jest.replaceProperty(
      AppConfig,
      "STRIPE_SECRET_KEY",
      "test_stripe_secret_key"
    );
  });

  describe("getStripeInstance", () => {
    it("should create a new Stripe instance with the secret key from AppConfig", () => {
      const instance = stripeService.getStripeInstance();
      expect(MockedStripe).toHaveBeenCalledWith(AppConfig.STRIPE_SECRET_KEY);
    });

    it("should return the existing instance on subsequent calls", () => {
      const instance1 = stripeService.getStripeInstance();
      const instance2 = stripeService.getStripeInstance();

      // Stripe constructor should only be called once
      expect(instance1).toBe(instance2);
    });
  });

  describe("createCustomers", () => {
    it("should call stripe.customers.create with correct parameters", async () => {
      const name = "John Doe";
      const email = "john.doe@example.com";
      const paymentMethod = "pm_12345";
      const mockCustomer = buildStripeCustMock({ id: "cus_123", email });
      mockCustomersCreate.mockResolvedValue(mockCustomer);

      const result = await stripeService.createCustomers(
        name,
        email,
        paymentMethod
      );

      expect(mockCustomersCreate).toHaveBeenCalledWith({
        name,
        email,
        payment_method: paymentMethod,
        invoice_settings: { default_payment_method: paymentMethod },
      });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe("createSubscription", () => {
    it("should call stripe.subscriptions.create with correct parameters for a STARTER plan", async () => {
      const mockCust = buildStripeCustMock({ id: "cus_123" });
      const plan = StripePlans.Starter;
      const mockSubscription = { id: "sub_123", status: "active" };
      mockSubscriptionsCreate.mockResolvedValue(mockSubscription);

      const result = await stripeService.createSubscription(mockCust, plan);

      expect(mockSubscriptionsCreate).toHaveBeenCalledWith({
        customer: mockCust.id,
        items: [{ price: "price_1S60ItDeXOegqDFkUiHdCJL3" }], // Corresponds to STARTER
        trial_period_days: 14,
        expand: ["latest_invoice.payment_intent"],
      });
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
