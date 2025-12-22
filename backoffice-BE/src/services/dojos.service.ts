import { eq } from "drizzle-orm";
import * as dbService from "../db/index.js";
import type { Transaction } from "../db/index.js";
import { dojos } from "../db/schema.js";
import {
  DojoRepository,
  IDojo,
  INewDojo,
  IUpdateDojo,
} from "../repositories/dojo.repository.js";

export const getOneDojo = async (
  whereClause: any,
  txInstance?: Transaction
): Promise<IDojo | null> => {
  const execute = async (tx: Transaction) => {
    return await DojoRepository.getOne(whereClause, tx);
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const getOneDojoByTag = async (
  tag: string,
  txInstance?: Transaction
): Promise<IDojo | null> => {
  const execute = async (tx: Transaction) => {
    try {
      return await DojoRepository.getOneByTag(tag, tx);
    } catch (err: any) {
      console.error(`Error fetching dojo by slug: ${tag}`, { err });
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
      return await DojoRepository.getOneByID(dojoId, tx);
    } catch (err: any) {
      console.error(`Error fetching dojo by ID: ${dojoId}`, { err });
      throw new Error(err);
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const getOneDojoByUserId = async ({
  userId,
  txInstance,
}: {
  userId: string;
  txInstance?: Transaction;
}): Promise<IDojo | null> => {
  const execute = async (tx: Transaction) => {
    try {
      return await getOneDojo(eq(dojos.userId, userId), tx);
    } catch (err: any) {
      console.error(`Error fetching dojo by UserId: ${userId}`, { err });
      throw err;
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const createDojo = async (
  newDojoDTO: INewDojo,
  txInstance?: dbService.Transaction
): Promise<IDojo> => {
  const execute = async (tx: Transaction) => {
    const newDojoID = await DojoRepository.create(newDojoDTO, tx);

    return (await getOneDojoByID(newDojoID, tx))!;
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const updateDojo = async ({
  dojoId,
  update,
  txInstance,
}: {
  dojoId: string;
  update: IUpdateDojo;
  txInstance?: Transaction;
}) => {
  const execute = async (tx: Transaction) => {
    await DojoRepository.update({ dojoId, update, tx });
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};
