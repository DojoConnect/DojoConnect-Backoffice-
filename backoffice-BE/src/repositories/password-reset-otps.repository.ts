import {
  eq,
  and,
  InferSelectModel,
  InferInsertModel,
  SQL,
  sql,
  gt,
} from "drizzle-orm";
import type { Transaction } from "../db";
import { passwordResetOTPs } from "../db/schema";
import { returnFirst } from "../utils/db.utils";
import AppConstants from "../constants/AppConstants";

export type IPasswordResetOTP = InferSelectModel<typeof passwordResetOTPs>;
export type INewPasswordResetOTP = InferInsertModel<typeof passwordResetOTPs>;

export type IUpdatePasswordResetOTP = Partial<
  Omit<INewPasswordResetOTP, "id" | "createdAt">
>;

export class PasswordResetOTPRepository {
  static async createOTP({
    dto,
    tx,
  }: {
    dto: INewPasswordResetOTP;
    tx: Transaction;
  }) {
    // Create OAuth link
    await tx.insert(passwordResetOTPs).values(dto);
  }

  static async updateOTP({
    update,
    tx,
    whereClause,
  }: {
    update: IUpdatePasswordResetOTP;
    whereClause: SQL;
    tx: Transaction;
  }) {
    await tx.update(passwordResetOTPs).set(update).where(whereClause);
  }

  static async updateOneOTP({
    otpID,
    update,
    tx,
    whereClause,
  }: {
    otpID: string;
    update: IUpdatePasswordResetOTP;
    whereClause?: SQL;
    tx: Transaction;
  }) {
    whereClause = whereClause || eq(passwordResetOTPs.id, otpID);
    await this.updateOTP({ whereClause, tx, update });
  }

  static async findOne({
    whereClause,
    tx,
  }: {
    whereClause: SQL | undefined;
    tx: Transaction;
  }) {
    return returnFirst(
      await tx
        .select()
        .from(passwordResetOTPs)
        .where(whereClause)
        .limit(1)
        .execute()
    );
  }

  static async incrementActiveOTPsAttempts({
    tx,
    userId,
  }: {
    userId: string;
    tx: Transaction;
  }) {
    await tx
      .update(passwordResetOTPs)
      .set({
        attempts: sql`${passwordResetOTPs.attempts} + 1`,
        blockedAt: sql`CASE WHEN ${passwordResetOTPs.attempts} + 1 >= ${AppConstants.MAX_OTP_VERIFICATION_ATTEMPTS} THEN NOW() ELSE NULL END`,
      })
      .where(
        and(
          eq(passwordResetOTPs.userId, userId),
          eq(passwordResetOTPs.used, false),
          gt(passwordResetOTPs.expiresAt, new Date())
        )
      );
  }
}
