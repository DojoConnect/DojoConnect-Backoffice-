import { DojoStatus, StripePlans } from "../constants/enums.js";
import { IDojo } from "../repositories/dojo.repository.js";

/** Used for data we send with auth for all user types. Hence the `toJson` Hides sensitive data */
export class BaseDojoDTO implements IDojo {
  id: string;
  ownerUserId: string;
  name: string;
  tag: string;
  tagline: string;
  status: DojoStatus;
  balance: string;
  stripeCustomerId: string;
  hasUsedTrial: boolean;
  activeSub: StripePlans;
  trialEndsAt: Date | null;
  referralCode: string;
  referredBy: string | null;
  createdAt: Date;

  constructor(params: IDojo) {
    this.id = params.id;
    this.ownerUserId = params.ownerUserId;
    this.name = params.name;
    this.tag = params.tag;
    this.tagline = params.tagline;
    this.status = params.status;
    this.balance = params.balance;
    this.stripeCustomerId = params.stripeCustomerId;
    this.activeSub = params.activeSub;
    this.trialEndsAt = params.trialEndsAt;
    this.referralCode = params.referralCode;
    this.hasUsedTrial = params.hasUsedTrial;
    this.referredBy = params.referredBy;
    this.createdAt = params.createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      tag: this.tag,
      tagline: this.tagline,
      createdAt: this.createdAt,
    };
  }
}
