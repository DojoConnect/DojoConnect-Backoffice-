import { DojoStatus, StripePlans } from "../constants/enums.js";
import { IDojo } from "../repositories/dojo.repository.js";

/** Used for data we send with auth for all user types. Hence the `toJson` Hides sensitive data */
export class BaseDojoDTO implements IDojo {
  id: string;
  userId: string;
  name: string;
  tag: string;
  tagline: string;
  status: DojoStatus;
  hasUsedTrial: boolean;
  activeSub: StripePlans;
  trialEndsAt: Date | null;
  referralCode: string;
  referredBy: string | null;
  createdAt: Date;

  constructor(params: IDojo) {
    this.id = params.id;
    this.userId = params.userId;
    this.name = params.name;
    this.tag = params.tag;
    this.tagline = params.tagline;
    this.status = params.status;
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
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}
