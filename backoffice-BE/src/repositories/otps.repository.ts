import { eq, and, InferSelectModel, InferInsertModel, SQL, sql, gt, isNull } from "drizzle-orm";
import type { Transaction } from "../db/index.js";
import { otps } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import AppConstants from "../constants/AppConstants.js";
import { OTPType } from "../constants/enums.js";

export type IOTP = InferSelectModel<typeof otps>;
export type INewOTP = Omit<InferInsertModel<typeof otps>, "id" | "createdAt">;
export type IUpdateOTP = Partial<Omit<INewOTP, "type" | "userId" | "hashedOTP">>;

export class OTPRepository {
  static async createOTP({ dto, tx }: { dto: INewOTP; tx: Transaction }) {
    // Create OAuth link
    await tx.insert(otps).values(dto);
  }

  static async updateOTP({
    update,
    tx,
    whereClause,
  }: {
    update: IUpdateOTP;
    whereClause: SQL;
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

  static async findOne({ whereClause, tx }: { whereClause: SQL | undefined; tx: Transaction }) {
    return returnFirst(
      await tx.select().from(otps).where(whereClause).limit(1).execute(),
    );
  }

  static async findOneActiveOTP({ tx, userId, otpHash, type }: { userId: string; otpHash: string; type: OTPType; tx: Transaction }) {
    return this.findOne({
      whereClause: and(
                eq(otps.type, type),
                eq(otps.userId, userId),
                eq(otps.hashedOTP, otpHash),
                eq(otps.used, false),
                isNull(otps.blockedAt),
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
        blockedAt: sql`CASE WHEN ${otps.attempts} + 1 >= ${AppConstants.MAX_OTP_VERIFICATION_ATTEMPTS} THEN NOW() ELSE NULL END`,
      })
      .where(
        and(
          eq(otps.userId, userId),
          eq(otps.used, false),
          gt(otps.expiresAt, new Date()),
        ),
      );
  }
}
