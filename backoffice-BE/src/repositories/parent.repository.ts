import { InferInsertModel, InferSelectModel, eq } from "drizzle-orm";
import { parents } from "../db/schema.js";
import { Transaction } from "../db/index.js";
import { returnFirst } from "../utils/db.utils.js";

export type IParent = InferSelectModel<typeof parents>;
export type INewParent = InferInsertModel<typeof parents>;
export type IUpdateParent = Partial<Omit<INewParent, "id" | "createdAt">>;

export class ParentRepository {
  static create = async (parent: INewParent, tx: Transaction) => {
    const [insertResult] = await tx
      .insert(parents)
      .values(parent)
      .$returningId();

    return insertResult.id;
  };

  static async getOne(
      whereClause: any,
      tx: Transaction
    ): Promise<IParent | null> {
      const parent = returnFirst(
        await tx.select().from(parents).where(whereClause).limit(1).execute()
      );
  
      return parent || null;
    }

  static getOneParentByUserId = async (userId: string, tx: Transaction) => {
    return await this.getOne(eq(parents.userId, userId), tx);
  };

  static update = async ({
    parentId,
    update,
    tx,
  }: {
    parentId: string;
    update: IUpdateParent;
    tx: Transaction;
  }) => {
    return await tx
      .update(parents)
      .set(update)
      .where(eq(parents.id, parentId));
  };
}
