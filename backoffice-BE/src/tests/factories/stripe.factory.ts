import Stripe from "stripe";
import { faker } from "@faker-js/faker";

export const buildStripePaymentMethodCardMock = (
  overrides?: Partial<Stripe.PaymentMethod.Card>
): Stripe.PaymentMethod.Card => {
  return {
    id: "card_123",
    brand: "visa",
    last4: "4242",
    exp_month: 12,
    exp_year: 2030,
    address_city: "Lagos",
    address_country: "NG",
    address_line1: "42 Ikoyi Crescent",
    ...overrides,
  } as Stripe.PaymentMethod.Card;
};

export const buildStripeCustMock = (
  overrides?: Partial<Stripe.Customer>
): Stripe.Customer => {
  return {
    id: "cus_123",
    email: "john.doe@example.com",
    ...overrides,
  } as Stripe.Customer;
};

export const buildStripePaymentMethodMock = (
  overrides?: Partial<Stripe.PaymentMethod>
): Stripe.PaymentMethod => {
  return {
    id: "pm_123",
    card: buildStripePaymentMethodCardMock(),
    ...overrides,
  } as Stripe.PaymentMethod;
};

export const buildStripeSubMock = (
  overrides?: Partial<Stripe.Subscription>
): Stripe.Subscription => {
  return {
    id: "sub_123",
    status: "active",
    ...overrides,
  } as Stripe.Subscription;
};

export const buildStripeSetupIntentMock = (
  overrides?: Partial<Stripe.SetupIntent>
): Stripe.SetupIntent => {
  return {
    id: "seti_123",
    client_secret: "seti_client_secret_123",
    ...overrides,
  } as Stripe.SetupIntent;
};

export const buildStripeProductMock = (
  overrides?: Partial<Stripe.Product>
): Stripe.Response<Stripe.Product> => {
  return {
    id: "prod_123",
    name: "Test Product",
    ...buildLastResponseMock(),
    ...overrides,
  } as Stripe.Response<Stripe.Product>;
};

export const buildStripePriceMock = (
  overrides?: Partial<Stripe.Price>
): Stripe.Response<Stripe.Price> => {
  return {
    id: "price_123",
    product: "prod_123",
    unit_amount: 1000,
    currency: "gbp",
    recurring: { interval: "month" },
    ...overrides,
  } as Stripe.Response<Stripe.Price>;
};

const buildLastResponseMock = () => {
  return {
    lastResponse: {
      headers: {},
      requestId: faker.string.uuid(),
      statusCode: faker.number.int({ min: 200, max: 500 }),
    },
  };
};
