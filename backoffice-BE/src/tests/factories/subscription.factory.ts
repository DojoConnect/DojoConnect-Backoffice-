import { faker } from "@faker-js/faker";
import { BillingStatus, StripeSubscriptionStatus } from "../../constants/enums.js";
import { IDojoSub } from "../../repositories/subscription.repository.js";
import {
  ClassSubStripeMetadata,
  DojoSubStripeMetadata,
  OneTimeClassStripeMetadata,
} from "../../types/subscription.types.js";
import { SubscriptionType } from "../../constants/subscription.constants.js";

export function buildSubscriptionMock(overrides: Partial<IDojoSub> = {}): IDojoSub {
  return {
    id: faker.string.uuid(),
    dojoId: faker.string.uuid(),
    stripeSubId: `sub_${faker.string.alphanumeric(14)}`,
    stripeSubStatus: StripeSubscriptionStatus.Active,
    stripeSetupIntentId: `seti_${faker.string.alphanumeric(14)}`,
    activeDojoId: faker.string.uuid(),
    billingStatus: BillingStatus.Active,
    createdAt: new Date(),
    ...overrides,
  };
}

export function buildDojoSubStripeMetadataMock(
  overrides: Partial<DojoSubStripeMetadata> = {},
): DojoSubStripeMetadata {
  return {
    type: SubscriptionType.DojoSub,
    dojoId: faker.string.uuid(),
    ...overrides,
  };
}

export function buildClassSubStripeMetadataMock(
  overrides: Partial<ClassSubStripeMetadata> = {},
): ClassSubStripeMetadata {
  return {
    type: SubscriptionType.ClassSub,
    classId: faker.string.uuid(),
    studentId: faker.string.uuid(),
    ...overrides,
  };
}

export function buildOneTimeClassStripeMetadataMock(
  overrides: Partial<OneTimeClassStripeMetadata> = {},
): OneTimeClassStripeMetadata {
  return {
    type: SubscriptionType.OneTimeClass,
    classId: faker.string.uuid(),
    studentId: faker.string.uuid(),
    ...overrides,
  };
}
