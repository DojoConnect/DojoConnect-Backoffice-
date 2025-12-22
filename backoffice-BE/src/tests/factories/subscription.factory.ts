
import { faker } from "@faker-js/faker";
import { BillingStatus, StripeSubscriptionStatus } from '../../constants/enums.js';
import { IDojoSub } from '../../repositories/subscription.repository.js';

export function buildSubscriptionMock(
  overrides: Partial<IDojoSub> = {}
): IDojoSub {
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
