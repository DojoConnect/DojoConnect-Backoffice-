import { and, eq, inArray, InferInsertModel, InferSelectModel, SQL } from "drizzle-orm";
import { dojoInstructors, users } from "../db/schema.js";
import { Transaction } from "../db/index.js";
import { returnFirst } from "../utils/db.utils.js";

export type IDojoInstructor = InferSelectModel<typeof dojoInstructors>;
export type INewDojoInstructor = InferInsertModel<typeof dojoInstructors>;
export type IUpdateDojoInstructor = Partial<Omit<INewDojoInstructor, "id" | "createdAt">>;

export interface InstructorDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dojoId: string;
  createdAt: Date;
}

export class InstructorsRepository {
  static async findOne({ whereClause, tx }: { whereClause: SQL | undefined; tx: Transaction }) {
    return returnFirst(
      await tx.select().from(dojoInstructors).where(whereClause).limit(1).execute(),
    );
  }

  static findOneById = async (id: string, tx: Transaction) => {
    return this.findOne({
      whereClause: eq(dojoInstructors.id, id),
      tx,
    });
  };

  static findManyByIds = async (ids: string[], tx: Transaction) => {
    return await tx
      .select()
      .from(dojoInstructors)
      .where(inArray(dojoInstructors.id, ids))
      .execute();
  };

  static findOneByUserId = async (userId: string, tx: Transaction) => {
    return this.findOne({
      whereClause: eq(dojoInstructors.instructorUserId, userId),
      tx,
    });
  };

  static findOneByIdAndDojoId = async (
    id: string,
    dojoId: string,
    tx: Transaction,
  ): Promise<IDojoInstructor | null> => {
    return this.findOne({
      whereClause: and(eq(dojoInstructors.id, id), eq(dojoInstructors.dojoId, dojoId)),
      tx,
    });
  };

  static findOneByUserIdAndDojoId(userId: string, dojoId: string, tx: Transaction) {
    return this.findOne({
      whereClause: and(
        eq(dojoInstructors.instructorUserId, userId),
        eq(dojoInstructors.dojoId, dojoId),
      ),
      tx,
    });
  }

  static fetchDojoInstructors = async ({
    dojoId,
    tx,
  }: {
    dojoId: string;
    tx: Transaction;
  }): Promise<InstructorDetails[]> => {
    return await tx
      .select({
        id: dojoInstructors.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        dojoId: dojoInstructors.dojoId,
        createdAt: dojoInstructors.createdAt,
      })
      .from(dojoInstructors)
      .innerJoin(users, eq(dojoInstructors.instructorUserId, users.id))
      .where(eq(dojoInstructors.dojoId, dojoId))
      .orderBy(dojoInstructors.createdAt)
      .execute();
  };

  static attachInstructorToDojo = async (
    instructorUserId: string,
    dojoId: string,
    tx: Transaction,
  ) => {
    await tx
      .insert(dojoInstructors)
      .values({
        instructorUserId,
        dojoId,
      })
      .execute();
  };
}
