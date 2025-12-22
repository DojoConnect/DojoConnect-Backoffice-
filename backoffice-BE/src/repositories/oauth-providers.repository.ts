import { eq, and, InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { Transaction } from "../db/index.js";
import { userOAuthAccounts } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import { SupportedOAuthProviders } from "../constants/enums.js";

export type IOAuthAcct = InferSelectModel<typeof userOAuthAccounts>;
export type INewOAuthAcct = InferInsertModel<typeof userOAuthAccounts>;

export type IUpdateOAuthProvider = Partial<
  Omit<INewOAuthAcct, "id" | "createdAt">
>;

export class UserOAuthAccountsRepository {
  static async findByProviderAndProviderUserId({
    provider,
    providerUserId,
    tx,
  }: {
    provider: SupportedOAuthProviders;
    providerUserId: string;
    tx: Transaction;
  }): Promise<IOAuthAcct | null> {
    return returnFirst(
      await tx
        .select()
        .from(userOAuthAccounts)
        .where(
          and(
            eq(userOAuthAccounts.providerUserId, providerUserId),
            eq(userOAuthAccounts.provider, provider)
          )
        )
        .limit(1)
        .execute()
    );
  }

  static async createOAuthAcct({
    dto,
    tx,
  }: {
    dto: INewOAuthAcct;
    tx: Transaction;
  }) {
    // Create OAuth link
    await tx.insert(userOAuthAccounts).values(dto);
  }

  static async updateOAuthAcct({
    oAuthAcctId,
    update,
    tx,
  }: {
    oAuthAcctId: string;
    update: IUpdateOAuthProvider;
    tx: Transaction;
  }) {
    await tx
      .update(userOAuthAccounts)
      .set(update)
      .where(eq(userOAuthAccounts.id, oAuthAcctId));
  }
}
