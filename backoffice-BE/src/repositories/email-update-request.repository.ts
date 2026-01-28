import { eq, and, desc,InferSelectModel, InferInsertModel, SQL } from "drizzle-orm";
import type { Transaction } from "../db/index.js";
import { emailUpdateRequests } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import { EmailUpdateStatus } from "../core/constants/auth.constants.js";

export type IEmailUpdateRequest = InferSelectModel<typeof emailUpdateRequests>;
export type INewEmailUpdateRequest = Omit<InferInsertModel<typeof emailUpdateRequests>, "id" | "requestedAt">;
export type IUpdateEmailUpdateRequest = Partial<Pick<INewEmailUpdateRequest, "status">>;

export class EmailUpdateRequestRepository {
  static async create({ dto, tx }: { dto: INewEmailUpdateRequest; tx: Transaction }) {
    const [result] = await tx.insert(emailUpdateRequests).values(dto).$returningId();
    return result.id;
  }

  static async findOne({ whereClause, tx }: { whereClause: SQL | undefined; tx: Transaction }) {
    return returnFirst(
      await tx.select().from(emailUpdateRequests).where(whereClause).limit(1).execute(),
    );
  }

  static async findLatestPendingByUserId({ userId, tx }: { userId: string; tx: Transaction }) {
    return returnFirst(await tx.select().from(emailUpdateRequests).where(and(
      eq(emailUpdateRequests.userId, userId),
      eq(emailUpdateRequests.status, EmailUpdateStatus.Pending),
    )).orderBy(desc(emailUpdateRequests.requestedAt)).limit(1).execute());
  }

  static async findByOtpId({ otpId, tx }: { otpId: string; tx: Transaction }) {
    return this.findOne({
      whereClause: eq(emailUpdateRequests.otpId, otpId),
      tx,
    });
  }

  static async updateStatus({
    id,
    status,
    tx,
  }: {
    id: string;
    status: EmailUpdateStatus;
    tx: Transaction;
  }) {
    await tx
      .update(emailUpdateRequests)
      .set({ status })
      .where(eq(emailUpdateRequests.id, id));
  }

  static async revokePendingByUserId({ userId, tx }: { userId: string; tx: Transaction }) {
    await tx
      .update(emailUpdateRequests)
      .set({ status: EmailUpdateStatus.Revoked })
      .where(
        and(
          eq(emailUpdateRequests.userId, userId),
          eq(emailUpdateRequests.status, EmailUpdateStatus.Pending),
        ),
      );
  }
}
