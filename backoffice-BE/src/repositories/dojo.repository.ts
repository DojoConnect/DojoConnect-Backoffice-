import {
  eq,
  getTableColumns,
  InferInsertModel,
  InferSelectModel,
  SQL,
} from "drizzle-orm";
import { dojoInstructors, dojos } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import { Transaction } from "../db/index.js";

export type IDojo = InferSelectModel<typeof dojos>;
export type INewDojo = InferInsertModel<typeof dojos>;
export type IUpdateDojo = Partial<Omit<INewDojo, "id" | "createdAt">>;

export class DojoRepository {
  static async getOne(
    whereClause: SQL | undefined,
    tx: Transaction
  ): Promise<IDojo | null> {
    const dojo = returnFirst(
      await tx.select().from(dojos).where(whereClause).limit(1).execute()
    );

    return dojo || null;
  }

  static async getOneByTag(
    tag: string,
    tx: Transaction
  ): Promise<IDojo | null> {
    return await this.getOne(eq(dojos.tag, tag), tx);
  }

  static async getOneByID(
    dojoId: string,
    tx: Transaction
  ): Promise<IDojo | null> {
    return await this.getOne(eq(dojos.id, dojoId), tx);
  }

  static async create(newDojoDTO: INewDojo, tx: Transaction) {
    const [insertResult] = await tx
      .insert(dojos)
      .values(newDojoDTO)
      .$returningId();

    return insertResult.id;
  }

  static update = async ({
    dojoId,
    update,
    tx,
  }: {
    dojoId: string;
    update: IUpdateDojo;
    tx: Transaction;
  }) => {
    await tx.update(dojos).set(update).where(eq(dojos.id, dojoId));
  };

  static getDojoForInstructor = async (
    instructorUserId: string,
    tx: Transaction
  ): Promise<IDojo | null> => {
    const dojo = returnFirst(
      await tx
        .select({ ...getTableColumns(dojos) })
        .from(dojos)
        .innerJoin(dojoInstructors, eq(dojoInstructors.dojoId, dojos.id))
        .where(eq(dojoInstructors.instructorUserId, instructorUserId))
        .limit(1)
        .execute()
    );

    return dojo;
  };

  static getDojoForOwner = async (
    ownerUserId: string,
    tx: Transaction
  ): Promise<IDojo | null> => {
    const dojo = returnFirst(
      await tx
        .select({ ...getTableColumns(dojos) })
        .from(dojos)
        .where(eq(dojos.ownerUserId, ownerUserId))
        .limit(1)
        .execute()
    );

    return dojo;
  };
}
