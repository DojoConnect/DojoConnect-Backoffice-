import { eq, InferInsertModel, InferSelectModel, SQL } from "drizzle-orm";
import { userCards, users } from "../db/schema.js";
import * as dbService from "../db/index.js";
import type { Transaction } from "../db/index.js";
import {
  INewUser,
  IUpdateUser,
  IUser,
  UserRepository,
} from "../repositories/user.repository.js";

export type IUserCard = InferSelectModel<typeof userCards>;
export type INewUserCard = InferInsertModel<typeof userCards>;

export class UsersService {
  static getOneUser = async (
    {
      whereClause,
      withPassword = false,
    }: {
      whereClause: SQL;
      withPassword?: boolean;
    },
    txInstance?: Transaction
  ): Promise<IUser | null> => {
    const execute = async (tx: Transaction) => {
      let user = await UserRepository.getOne({ whereClause, withPassword, tx });

      if (!user) {
        return null;
      }

      if (!withPassword) {
        const { passwordHash, ...rest } = user;
        user = { ...rest } as IUser;
      }

      return user;
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getOneUserByID = async ({
    userId,
    txInstance,
  }: {
    userId: string;
    txInstance?: Transaction;
  }): Promise<IUser | null> => {
    const execute = async (tx: Transaction) => {
      try {
        return await UsersService.getOneUser(
          { whereClause: eq(users.id, userId) },
          tx
        );
      } catch (err: any) {
        console.error(`Error fetching user by ID: ${userId}`, { err });
        throw err;
      }
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getOneUserByEmail = async ({
    email,
    withPassword = false,
    txInstance,
  }: {
    email: string;
    withPassword?: boolean;
    txInstance?: Transaction;
  }): Promise<IUser | null> => {
    const execute = async (tx: Transaction) => {
      try {
        return await UsersService.getOneUser(
          {
            whereClause: eq(users.email, email),
            withPassword,
          },
          tx
        );
      } catch (err: any) {
        console.error(`Error fetching user by Email: ${email}`, { err });
        throw err;
      }
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static getOneUserByUserName = async ({
    username,
    txInstance,
  }: {
    username: string;
    txInstance?: Transaction;
  }): Promise<IUser | null> => {
    const execute = async (tx: Transaction) => {
      try {
        return await UsersService.getOneUser(
          {
            whereClause: eq(users.username, username),
          },
          tx
        );
      } catch (err: any) {
        console.error(`Error fetching dojo by Username: ${username}`, { err });
        throw err;
      }
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static fetchUserCards = async (
    userId: string,
    txInstance?: Transaction
  ): Promise<IUserCard[]> => {
    const execute = async (tx: Transaction) => {
      try {
        const cards = await tx
          .select()
          .from(userCards)
          .where(eq(userCards.userId, userId))
          .execute();

        return cards;
      } catch (err: any) {
        console.error(`Error fetching user cards for user ID: ${userId}`, {
          err,
        });
        throw err;
      }
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static fetchUserCardsByPaymentMethod = async (
    paymentMethod: string,
    txInstance?: Transaction
  ): Promise<IUserCard[]> => {
    const execute = async (tx: Transaction) => {
      try {
        const cards = await tx
          .select()
          .from(userCards)
          .where(eq(userCards.paymentMethodId, paymentMethod))
          .execute();

        return cards;
      } catch (err: any) {
        console.error(
          `Error fetching user cards by payment method: ${paymentMethod}`,
          { err }
        );
        throw err;
      }
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static saveUser = async (user: INewUser, txInstance?: Transaction) => {
    const execute = async (tx: Transaction) => {
      const newUserId = await UserRepository.create(user, tx);

      return (await UsersService.getOneUserByID({
        userId: newUserId,
        txInstance: tx,
      }))!;
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static updateUser = async ({
    userId,
    update,
    txInstance,
  }: {
    userId: string;
    update: IUpdateUser;
    txInstance?: Transaction;
  }) => {
    const execute = async (tx: Transaction) => {
      await UserRepository.update({ userId, update, tx });
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static saveUserCard = async (
    userCard: INewUserCard,
    txInstance?: Transaction
  ) => {
    const execute = async (tx: Transaction) => {
      await tx.insert(userCards).values(userCard);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

  static generateReferralCode = () =>
    "DOJ" + Math.floor(1000 + Math.random() * 9000); // rand(1000, 9999)
}

