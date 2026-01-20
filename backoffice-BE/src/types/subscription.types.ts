import { SubscriptionType } from "../constants/subscription.constants.js";

export type DojoSubStripeMetadata = {
  type: SubscriptionType.DojoSub;
  dojoId: string;
};

export type ClassSubStripeMetadata = {
  type: SubscriptionType.ClassSub;
  classId: string;
  studentId: string;
};

export type OneTimeClassStripeMetadata = {
  type: SubscriptionType.OneTimeClass;
  classId: string;
  studentId: string;
};

export type StripeMetadata =
  | DojoSubStripeMetadata
  | ClassSubStripeMetadata
  | OneTimeClassStripeMetadata;
