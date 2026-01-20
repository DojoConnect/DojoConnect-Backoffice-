import { eq, InferInsertModel } from "drizzle-orm";
import { stripeWebhookEvents } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import { Transaction } from "../db/index.js";

export type IStripeWebhookEvent = InferInsertModel<typeof stripeWebhookEvents>;
export type INewStripeWebhookEvent = InferInsertModel<typeof stripeWebhookEvents>;

export class StripeWebhookEventsRepository {
  static async create(newStripeWebhookEventDTO: INewStripeWebhookEvent, tx: Transaction) {
    await tx.insert(stripeWebhookEvents).values(newStripeWebhookEventDTO).$returningId();
    return newStripeWebhookEventDTO;
  }

  static async getOne(whereClause: any, tx: Transaction): Promise<IStripeWebhookEvent | null> {
    const stripeWebhookEvent = returnFirst(
      await tx.select().from(stripeWebhookEvents).where(whereClause).limit(1).execute(),
    );

    return stripeWebhookEvent || null;
  }

  static async getOneByID(id: string, tx: Transaction): Promise<IStripeWebhookEvent | null> {
    return await this.getOne(eq(stripeWebhookEvents.id, id), tx);
  }
}
