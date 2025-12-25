import { and, eq, InferInsertModel, InferSelectModel, SQL } from "drizzle-orm";
import { dojoInstructors } from "../db/schema.js";
import { Transaction } from "../db/index.js";
import { returnFirst } from "../utils/db.utils.js";

export type IDojoInstructor = InferSelectModel<typeof dojoInstructors>;
export type INewDojoInstructor = InferInsertModel<typeof dojoInstructors>;
export type IUpdateDojoInstructor = Partial<
  Omit<INewDojoInstructor, "id" | "createdAt">
>;

export class InstructorsRepository {
  static async findOne({
    whereClause,
    tx,
  }: {
    whereClause: SQL | undefined;
    tx: Transaction;
  }) {
    return returnFirst(
      await tx
        .select()
        .from(dojoInstructors)
        .where(whereClause)
        .limit(1)
        .execute()
    );
  }

  static findOneById = async (id: string, tx: Transaction) => {
    return this.findOne({
      whereClause: eq(dojoInstructors.id, id),
      tx,
    });
  };

  static findOneByUserId = async (userId: string, tx: Transaction) => {
    return this.findOne({
      whereClause: eq(dojoInstructors.userId, userId),
      tx,
    });
  };

  static findOneByUserIdAndDojoId(
    userId: string,
    dojoId: string,
    tx: Transaction
  ) {
    return this.findOne({
      whereClause: and(
        eq(dojoInstructors.userId, userId),
        eq(dojoInstructors.dojoId, dojoId)
      ),
      tx,
    });
  }

  static attachInstructorToDojo = async (
    userId: string,
    dojoId: string,
    tx: Transaction
  ) => {
    await tx
      .insert(dojoInstructors)
      .values({
        userId,
        dojoId,
      })
      .execute();
  };
}
