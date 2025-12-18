import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { dojos } from "../db/schema";
import { returnFirst } from "../utils/db.utils";
import { Transaction } from "../db";

export type IDojo = InferSelectModel<typeof dojos>;
export type INewDojo = InferInsertModel<typeof dojos>;

export class DojoRepository {
  static async getOne(
    whereClause: any,
    tx: Transaction
  ): Promise<IDojo | null> {
    const dojo = returnFirst(
      await tx.select().from(dojos).where(whereClause).limit(1).execute()
    );

    return dojo || null;
  }

  static async getOneBySlug(
    slug: string,
    tx: Transaction
  ): Promise<IDojo | null> {
    return await this.getOne(eq(dojos.tag, slug), tx);
  }

  static async getOneByID(
    dojoId: string,
    tx: Transaction
  ): Promise<IDojo | null> {
    return await this.getOne(eq(dojos.id, dojoId), tx);
  }

  static getOneByUserName = async ({
    username,
    tx,
  }: {
    username: string;
    tx: Transaction;
  }): Promise<IDojo | null> => {
    return await this.getOne(eq(dojos.username, username), tx);
  };

  static async create(newDojoDTO: INewDojo, tx: Transaction) {
    const [insertResult] = await tx
      .insert(dojos)
      .values(newDojoDTO)
      .$returningId();

    return insertResult.id;
  }
}
