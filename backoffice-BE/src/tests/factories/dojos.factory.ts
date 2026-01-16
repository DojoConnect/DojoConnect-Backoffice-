import { DojoStatus, StripePlans } from "../../constants/enums.js";
import { IDojo } from "../../repositories/dojo.repository.js";

export const buildDojoMock = (overrides?: Partial<IDojo>): IDojo => {
  return {
    id: "1`",
    ownerUserId: "1",
    name: "Desmond Dojo",
    tag: "DESM",
    tagline: "Building champions",
    activeSub: StripePlans.Monthly,
    status: DojoStatus.Trailing,
    balance: "150.75",
    stripeCustomerId: "cus_9f3h28fh32",
    referralCode: "REFJOHN2024",
    referredBy: "ref_12345",
    hasUsedTrial: false,
    trialEndsAt: new Date("2025-02-01T10:00:00.000Z"),
    createdAt: new Date("2024-01-10T12:00:00"),
    ...overrides, // Allows overriding specific fields for different test scenarios
  };
};
