import { eq, desc, InferSelectModel, InferInsertModel } from "drizzle-orm";
import { Transaction } from "../db";
import { dojoSubscriptions } from "../db/schema";
import { returnFirst } from "../utils/db.utils";

export type IDojoSub = InferSelectModel<typeof dojoSubscriptions>;
export type INewDojoSub = InferInsertModel<typeof dojoSubscriptions>;
export type IUpdateDojoSub = Partial<Omit<INewDojoSub, "id" | "createdAt">>;

export class SubscriptionRepository {
  static async findLatestDojoAdminSub(dojoId: string, tx: Transaction) {
    return returnFirst(
      await tx
        .select()
        .from(dojoSubscriptions)
        .where(eq(dojoSubscriptions.dojoId, dojoId))
        .orderBy(desc(dojoSubscriptions.createdAt))
        .limit(1)
        .execute()
    );
  }

  static async createDojoAdminSub(newDojoSubDTO: INewDojoSub, tx: Transaction) {
    const [insertResult] = await tx
      .insert(dojoSubscriptions)
      .values(newDojoSubDTO)
      .$returningId();

    return insertResult.id;
  }

  static updateDojoAdminSub = async ({
    dojoSubId,
    update,
    tx,
  }: {
    dojoSubId: string;
    update: IUpdateDojoSub;
    tx: Transaction;
  }) => {
    await tx
      .update(dojoSubscriptions)
      .set(update)
      .where(eq(dojoSubscriptions.id, dojoSubId));
  };
}
