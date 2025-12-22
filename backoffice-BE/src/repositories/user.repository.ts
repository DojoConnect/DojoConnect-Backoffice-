import { eq, InferInsertModel, InferSelectModel, SQL } from "drizzle-orm";
import { users } from "../db/schema.js";
import { Transaction } from "../db/index.js";
import { returnFirst } from "../utils/db.utils.js";

export type IUser = InferSelectModel<typeof users>;
export type INewUser = InferInsertModel<typeof users>;
export type IUpdateUser = Partial<Omit<INewUser, "id" | "createdAt">>;

export class UserRepository {
  static getOne = async ({
    whereClause,
    withPassword = false,
    tx,
  }: {
    whereClause: SQL;
    withPassword?: boolean;
    tx: Transaction;
  }): Promise<IUser | null> => {
    let user = returnFirst(
      await tx.select().from(users).where(whereClause).limit(1).execute()
    );

    if (!user) {
      return null;
    }

    if (!withPassword) {
      const { passwordHash, ...rest } = user;
      user = { ...rest } as IUser;
    }

    return user;
  };

  static getOneByID = async ({
    userId,
    tx,
  }: {
    userId: string;
    tx: Transaction;
  }): Promise<IUser | null> => {
    try {
      return await this.getOne({ whereClause: eq(users.id, userId), tx });
    } catch (err: any) {
      console.error(`Error fetching user by ID: ${userId}`, { err });
      throw err;
    }
  };

  static getOneByEmail = async ({
    email,
    withPassword = false,
    tx,
  }: {
    email: string;
    withPassword?: boolean;
    tx: Transaction;
  }): Promise<IUser | null> => {
    try {
      return await this.getOne({
        whereClause: eq(users.email, email),
        withPassword,
        tx,
      });
    } catch (err: any) {
      console.error(`Error fetching user by Email: ${email}`, { err });
      throw err;
    }
  };

  static create = async (user: INewUser, tx: Transaction) => {
    const [insertResult] = await tx.insert(users).values(user).$returningId();

    return insertResult.id;
  };

  static update = async ({
    userId,
    update,
    tx,
  }: {
    userId: string;
    update: IUpdateUser;
    tx: Transaction;
  }) => {
    await tx.update(users).set(update).where(eq(users.id, userId));
  };
}
