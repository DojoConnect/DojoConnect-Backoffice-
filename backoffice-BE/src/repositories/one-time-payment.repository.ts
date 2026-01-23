import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { oneTimeClassPayments } from "../db/schema.js";
import { Transaction } from "../db/index.js";

export type IOneTimeClassPayment = InferSelectModel<typeof oneTimeClassPayments>;
export type INewOneTimeClassPayment = InferInsertModel<typeof oneTimeClassPayments>;

export class OneTimePaymentRepository {
  static create = async (data: INewOneTimeClassPayment, tx: Transaction) => {
    const [insertResult] = await tx.insert(oneTimeClassPayments).values(data).$returningId();
    return insertResult.id;
  };
}
