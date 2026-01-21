import { IParent } from "../repositories/parent.repository.js";
import { AddChildDTO } from "../validations/parent.schemas.js";

export type { AddChildDTO };

export class ParentDTO implements IParent {
  id: string;
  userId: string;
  stripeCustomerId: string;
  updatedAt: string;
  createdAt: string;

  constructor(params: IParent) {
    this.id = params.id;
    this.userId = params.userId;
    this.stripeCustomerId = params.stripeCustomerId;
    this.updatedAt = params.updatedAt;
    this.createdAt = params.createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      createdAt: this.createdAt,
    };
  }
}
