import * as dbService from "../db";
import type { Transaction } from "../db";
import {
  DojoRepository,
  IDojo,
  INewDojo,
} from "../repositories/dojo.repository";

export const getOneDojo = async (
  whereClause: any,
  txInstance?: Transaction
): Promise<IDojo | null> => {
  const execute = async (tx: Transaction) => {
    return await DojoRepository.getOne(whereClause, tx);
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const getOneDojoBySlug = async (
  slug: string,
  txInstance?: Transaction
): Promise<IDojo | null> => {
  const execute = async (tx: Transaction) => {
    try {
      return await DojoRepository.getOneBySlug(slug, tx);
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
      return await DojoRepository.getOneByID(dojoId, tx);
    } catch (err: any) {
      console.error(`Error fetching dojo by ID: ${dojoId}`, { err });
      throw new Error(err);
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const getOneDojoByUserName = async ({
  username,
  txInstance,
}: {
  username: string;
  txInstance?: Transaction;
}): Promise<IDojo | null> => {
  const execute = async (tx: Transaction) => {
    try {
      return await DojoRepository.getOneByUserName({ username, tx });
    } catch (err: any) {
      console.error(`Error fetching dojo by Username: ${username}`, { err });
      throw err;
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const createDojo = async (
  newDojoDTO: INewDojo,
  txInstance?: dbService.Transaction
) => {
  const execute = async (tx: Transaction) => {
    return await DojoRepository.create(newDojoDTO, tx);
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};
