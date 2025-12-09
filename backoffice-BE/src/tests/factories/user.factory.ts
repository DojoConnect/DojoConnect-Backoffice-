import { Role, StripePlans } from "../../constants/enums";
import { IUser } from "../../services/users.service";

export const buildUserMock = (overrides?: Partial<IUser>): IUser => {
  return {
    id: "usr_01",
    name: "John Doe",
    username: "john_d",
    email: "john@example.com",
    passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$examplehashhere",
    referredBy: "ref_12345",
    avatar: "https://example.com/avatar.jpg",
    role: Role.DojoAdmin,
    balance: "150.75",
    referralCode: "REFJOHN2024",
    activeSub: StripePlans.Trial,
    dob: "1990-05-14",
    gender: "male",
    city: "Lagos",
    street: "42 Ikoyi Crescent",
    stripeCustomerId: "cus_9f3h28fh32",
    stripeSubscriptionId: "sub_93hf2h923",
    subscriptionStatus: "active",
    trialEndsAt: "2025-02-01T10:00:00.000Z",
    stripeAccountId: "acct_83hf2h2f",
    fcmToken: "fcm_token_example_8293hf2f",
    sessionId: "sess_8f2h9f23fh2",
    createdAt: new Date("2024-01-10T12:00:00Z").toISOString(),
    ...overrides, // Allows overriding specific fields for different test scenarios
  };
};
