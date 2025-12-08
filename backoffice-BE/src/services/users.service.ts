import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { userCards, users } from "../db/schema";
import * as dbService from "../db";
import type { Transaction } from "../db";
import * as stripeService from "./stripe.service";

import { findOne } from "../utils/db.utils";
import { NotFoundException } from "../core/errors";

export type IUser = InferSelectModel<typeof users>;
export type IUserCard = InferSelectModel<typeof userCards>;
export type INewUser = InferInsertModel<typeof users>;
export type INewUserCard = InferInsertModel<typeof userCards>;

export const getOneUser = async (
  {
    whereClause,
    withPassword = false,
  }: { whereClause: any; withPassword?: boolean },
  txInstance?: Transaction
): Promise<IUser | null> => {
  const execute = async (tx: Transaction) => {
    let user = findOne(
      await tx.select().from(users).where(whereClause).limit(1).execute()
    );

    if (!user) {
      return null;
    }

    if (!withPassword) {
      const { passwordHash, ...rest } = user;
      user = {...rest} as IUser;
    }

    return user;
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const getOneUserByID = async ({
  userId,
  txInstance,
}: {
  userId: string;
  txInstance?: Transaction;
}): Promise<IUser | null> => {
  const execute = async (tx: Transaction) => {
    try {
      return await getOneUser({ whereClause: eq(users.id, userId) }, tx);
    } catch (err: any) {
      console.error(`Error fetching dojo by ID: ${userId}`, { err });
      throw new Error(err);
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const getOneUserByEmail = async ({
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
      return await getOneUser(
        { whereClause: eq(users.email, email), withPassword },
        tx
      );
    } catch (err: any) {
      console.error(`Error fetching dojo by Email: ${email}`, { err });
      throw new Error(err);
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const getOneUserByUserName = async (
  username: string,
  txInstance?: Transaction
): Promise<IUser | null> => {
  const execute = async (tx: Transaction) => {
    try {
      return getOneUser({ whereClause: eq(users.username, username) }, tx);
    } catch (err: any) {
      console.error(`Error fetching dojo by Username: ${username}`, { err });
      throw new Error(err);
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const fetchUserCards = async (
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
      console.error(`Error fetching dojo by Email: ${userId}`, { err });
      throw new Error(err);
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const fetchUserCardsByPaymentMethod = async (
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
      console.error(`Error fetching dojo by Email: ${paymentMethod}`, { err });
      throw new Error(err);
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const setDefaultPaymentMethod = async (
  user: IUser,
  paymentMethod: string,
  txInstance?: Transaction
) => {
  const execute = async (tx: Transaction) => {
    const pm = await stripeService.retrievePaymentMethod(paymentMethod);
    const card = pm.card;

    if (!card) {
      throw new NotFoundException("Card for payment method not found");
    }

    await tx
      .update(userCards)
      .set({ isDefault: false })
      .where(eq(userCards.userId, user.id));

    const existingCards = await fetchUserCardsByPaymentMethod(paymentMethod);

    if (existingCards.length === 0) {
      // Insert Card
      await saveUserCard({
        userId: user.id,
        paymentMethodId: paymentMethod,
        brand: card.brand,
        last4: card.last4,
        expMonth: card.exp_month,
        expYear: card.exp_year,
        isDefault: true,
      });
    }
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const saveUser = async (user: INewUser, txInstance?: Transaction) => {
  const execute = async (tx: Transaction) => {
    const [insertResult] = await tx.insert(users).values(user).$returningId();

    return (await getOneUserByID({
      userId: insertResult.id,
      txInstance,
    }))!;
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const saveUserCard = async (
  userCard: INewUserCard,
  txInstance?: Transaction
) => {
  const execute = async (tx: Transaction) => {
    await tx.insert(userCards).values(userCard);
  };

  return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
};

export const generateReferralCode = () =>
  "DOJ" + Math.floor(1000 + Math.random() * 9000); // rand(1000, 9999)
