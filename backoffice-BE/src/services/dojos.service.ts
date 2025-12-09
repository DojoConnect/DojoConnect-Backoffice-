import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as dbService from "../db";
import { dojos } from "../db/schema";
import { returnFirst } from "../utils/db.utils";
import type { Transaction } from "../db";

export type IDojo = InferSelectModel<typeof dojos>;
export type INewDojo = InferInsertModel<typeof dojos>;

export const getOneDojo = async (
  whereClause: any,
  txInstance?: Transaction
): Promise<IDojo | null> => {
  const execute = async (tx: Transaction) => {
    const dojo = returnFirst(
      await tx.select().from(dojos).where(whereClause).limit(1).execute()
    );

    if (!dojo) {
      return null;
    }

    return dojo;
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const getOneDojoBySlug = async (
  slug: string,
  txInstance?: Transaction
): Promise<IDojo | null> => {
  const execute = async (tx: Transaction) => {
    try {
      return await getOneDojo(eq(dojos.tag, slug), tx);
    } catch (err: any) {
      console.error(`Error fetching dojo by slug: ${slug}`, { err });
      throw new Error(err);
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const getOneDojoByID = async (
  dojoId: string,
  txInstance?: Transaction
): Promise<IDojo | null> => {
  const execute = async (tx: Transaction) => {
    try {
      return await getOneDojo(eq(dojos.id, dojoId), tx);
    } catch (err: any) {
      console.error(`Error fetching dojo by ID: ${dojoId}`, { err });
      throw new Error(err);
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const saveDojo = async (
  newDojoDTO: INewDojo,
  txInstance?: dbService.Transaction
) => {
  const execute = async (tx: Transaction) => {
    const [insertResult] = await tx
      .insert(dojos)
      .values(newDojoDTO)
      .$returningId();

    return insertResult.id;
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};
