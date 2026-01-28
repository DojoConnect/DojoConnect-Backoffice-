import { eq, and, InferSelectModel, InferInsertModel, SQL, sql, gt, isNull } from "drizzle-orm";
import type { Transaction } from "../db/index.js";
import { otps } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import AppConstants from "../constants/AppConstants.js";
import { OtpStatus, OtpType } from "../core/constants/auth.constants.js";

export type IOTP = InferSelectModel<typeof otps>;
export type INewOTP = Omit<InferInsertModel<typeof otps>, "id" | "createdAt">;
export type IUpdateOTP = Partial<Omit<INewOTP, "type" | "userId" | "hashedOTP">>;

export class OTPRepository {
  static async createOTP({ dto, tx }: { dto: INewOTP; tx: Transaction }) {
    const [result] = await tx.insert(otps).values(dto).$returningId();
    return result.id;
  }

  static async updateOTP({
    update,
    tx,
    whereClause,
  }: {
    update: IUpdateOTP;
    whereClause: SQL|undefined;
    tx: Transaction;
  }) {
    await tx.update(otps).set(update).where(whereClause);
  }

  static async updateById({
    otpID,
    update,
    tx,
    whereClause,
  }: {
    otpID: string;
    update: IUpdateOTP;
    whereClause?: SQL;
    tx: Transaction;
  }) {
    whereClause = whereClause || eq(otps.id, otpID);
    await this.updateOTP({ whereClause, tx, update });
  }

  static async updateByUserId({
    userId,
    update,
    tx,
    whereClause,
  }: {
    userId: string;
    update: IUpdateOTP;
    whereClause?: SQL;
    tx: Transaction;
  }) {
    whereClause = whereClause || eq(otps.userId, userId);
    await this.updateOTP({ whereClause, tx, update });
  }

  static async revokeUserPendingOTPs({ tx, userId }: { userId: string; tx: Transaction }) {
    await this.updateOTP({
      whereClause: and(eq(otps.userId, userId), eq(otps.status, OtpStatus.Pending)),
      update: {
        status: OtpStatus.Revoked,
      },
      tx,
    });
  }

  static async findOne({ whereClause, tx }: { whereClause: SQL | undefined; tx: Transaction }) {
    return returnFirst(
      await tx.select().from(otps).where(whereClause).limit(1).execute(),
    );
  }

  static async findById({ otpID, tx }: { otpID: string; tx: Transaction }) {
    return this.findOne({
      whereClause: eq(otps.id, otpID),
      tx,
    });
  }

  static async findOneActiveOTP({ tx, userId, otpHash, type }: { userId: string; otpHash: string; type: OtpType; tx: Transaction }) {
    return this.findOne({
      whereClause: and(
                eq(otps.type, type),
                eq(otps.userId, userId),
                eq(otps.hashedOTP, otpHash),
                eq(otps.status, OtpStatus.Pending),
                isNull(otps.revokedAt),
                gt(otps.expiresAt, new Date()),
              ),
      tx,
    });
  }

  static async incrementActiveOTPsAttempts({ tx, userId }: { userId: string; tx: Transaction }) {
    await tx
      .update(otps)
      .set({
        attempts: sql`${otps.attempts} + 1`,
        revokedAt: sql`CASE WHEN ${otps.attempts} + 1 >= ${AppConstants.MAX_OTP_VERIFICATION_ATTEMPTS} THEN NOW() ELSE NULL END`,
      })
      .where(
        and(
          eq(otps.userId, userId),
          eq(otps.status, OtpStatus.Pending),
          gt(otps.expiresAt, new Date()),
        ),
      );
  }

  static deleteById = async ({ tx, otpID }: { otpID: string; tx: Transaction }) => {
    await tx.delete(otps).where(eq(otps.id, otpID));
  }

  static async deleteByUserIdAndType({ tx, userId, type }: { userId: string; type: OtpType; tx: Transaction }) {
    await tx.delete(otps).where(and(eq(otps.userId, userId), eq(otps.type, type)));
  }
}