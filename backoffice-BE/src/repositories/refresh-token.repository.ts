import { eq, InferInsertModel, InferSelectModel, SQL } from "drizzle-orm";
import { refreshTokens } from "../db/schema";
import { Transaction } from "../db";
import { returnFirst } from "../utils/db.utils";

export type INewRefreshToken = InferInsertModel<typeof refreshTokens>;
export type IRefreshToken = InferSelectModel<typeof refreshTokens>;

export class RefreshTokenRepository {
  static async create(token: INewRefreshToken, tx: Transaction) {
    await tx.insert(refreshTokens).values(token);
  }

  static async getOne(
    token: string,
    tx: Transaction
  ): Promise<IRefreshToken | null> {
    const storedToken = returnFirst(
      await tx
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.hashedToken, token))
        .limit(1)
        .execute()
    );

    return storedToken || null;
  }

  /**
   * Token Rotation: Revoke the old token (or delete it)
       We mark it as revoked or delete it to prevent reuse.
  
       We choose to delete now to remove the need for cleaning up later
   */
  static async deleteById(tokenId: string, tx: Transaction) {
    await this.delete({ tx, whereClause: eq(refreshTokens.id, tokenId) });
  }

   static async deleteByUserId  (
    userId: string,
    tx: Transaction
  ) {
      await this.delete({
        tx,
        whereClause: eq(refreshTokens.userId, userId),
      });
    
  };

  static async delete (
    {whereClause, tx}:{whereClause: SQL,
    tx: Transaction}
  ) {
      await tx.delete(refreshTokens).where(whereClause);
  };
  
}