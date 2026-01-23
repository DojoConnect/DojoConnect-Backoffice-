import { eq, desc, InferSelectModel, InferInsertModel, SQL, and, or } from "drizzle-orm";
import { Transaction } from "../db/index.js";
import { classSubscriptions, dojoSubscriptions } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import { BillingStatus } from "../constants/enums.js";

export type IDojoSub = InferSelectModel<typeof dojoSubscriptions>;
export type INewDojoSub = InferInsertModel<typeof dojoSubscriptions>;
export type IUpdateDojoSub = Partial<Omit<INewDojoSub, "id" | "createdAt">>;

export type IClassSub = InferSelectModel<typeof classSubscriptions>;
export type INewClassSub = InferInsertModel<typeof classSubscriptions>;
export type IUpdateClassSub = Partial<Omit<INewClassSub, "id" | "createdAt">>;

export class SubscriptionRepository {
  static async findLatestDojoAdminSub(dojoId: string, tx: Transaction) {
    return returnFirst(
      await tx
        .select()
        .from(dojoSubscriptions)
        .where(eq(dojoSubscriptions.dojoId, dojoId))
        .orderBy(desc(dojoSubscriptions.createdAt))
        .limit(1)
        .execute(),
    );
  }

  static findOneDojoSub = async (
    whereClause: SQL | undefined,
    tx: Transaction,
  ): Promise<IDojoSub | null> => {
    const dojoSub = returnFirst(
      await tx.select().from(dojoSubscriptions).where(whereClause).limit(1).execute(),
    );

    return dojoSub || null;
  };

  static findOneDojoSubById = async (
    dojoSubId: string,
    tx: Transaction,
  ): Promise<IDojoSub | null> => {
    const dojoSub = this.findOneDojoSub(eq(dojoSubscriptions.id, dojoSubId), tx);

    return dojoSub || null;
  };

  static async createDojoAdminSub(newDojoSubDTO: INewDojoSub, tx: Transaction) {
    const [insertResult] = await tx.insert(dojoSubscriptions).values(newDojoSubDTO).$returningId();

    return insertResult.id;
  }

  static updateDojoAdminSub = async ({
    dojoSubId,
    update,
    tx,
  }: {
    dojoSubId: string;
    update: IUpdateDojoSub;
    tx: Transaction;
  }) => {
    await tx.update(dojoSubscriptions).set(update).where(eq(dojoSubscriptions.id, dojoSubId));
  };

  static async createClassSub(newClassSubDTO: INewClassSub, tx: Transaction) {
    const [insertResult] = await tx
      .insert(classSubscriptions)
      .values(newClassSubDTO)
      .$returningId();

    return insertResult.id;
  }

  static findOneClassSub = async (
    whereClause: SQL | undefined,
    tx: Transaction,
  ): Promise<IClassSub | null> => {
    const classSub = returnFirst(
      await tx.select().from(classSubscriptions).where(whereClause).limit(1).execute(),
    );

    return classSub || null;
  };

  static findOneClassSubByStripeSubId = async (
    stripeSubId: string,
    tx: Transaction,
  ): Promise<IClassSub | null> => {
    return await this.findOneClassSub(eq(classSubscriptions.stripeSubId, stripeSubId), tx);
  };

  static findOneActiveClassSubByClassIdAndStudentId = async (
    classId: string,
    studentId: string,
    tx: Transaction,
  ): Promise<IClassSub | null> => {
    return await this.findOneClassSub(
      and(
        eq(classSubscriptions.classId, classId),
        eq(classSubscriptions.studentId, studentId),
        or(
          eq(classSubscriptions.status, BillingStatus.Active),
          eq(classSubscriptions.status, BillingStatus.Trialing),
        ),
      ),
      tx,
    );
  };

  static updateClassSubByStripeSubId = async ({
    stripeSubId,
    update,
    tx,
  }: {
    stripeSubId: string;
    update: IUpdateClassSub;
    tx: Transaction;
  }) => {
    await tx
      .update(classSubscriptions)
      .set(update)
      .where(eq(classSubscriptions.stripeSubId, stripeSubId));
  };
}
