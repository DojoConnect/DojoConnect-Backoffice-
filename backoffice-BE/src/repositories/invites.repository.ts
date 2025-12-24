import { and, eq, InferInsertModel, InferSelectModel, not, SQL } from "drizzle-orm";
import { Transaction } from "../db/index.js";
import { instructorInvites } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import { InstructorInviteStatus } from "../constants/enums.js";

export type IInstructorInvite = InferSelectModel<typeof instructorInvites>;
export type INewInstructorInvite = InferInsertModel<typeof instructorInvites>;
export type IUpdateInstructorInvite = Partial<
  Omit<INewInstructorInvite, "id" | "createdAt">
>;

export class InvitesRepository {
  static createInstructorInvite = async (
    invite: INewInstructorInvite,
    tx: Transaction
  ) => {
    const [newInvite] = await tx.insert(instructorInvites).values(invite);
    return newInvite.insertId;
  };

  static async findOneInstructorInvite({
    whereClause,
    tx,
  }: {
    whereClause: SQL | undefined;
    tx: Transaction;
  }) {
    return returnFirst(
      await tx
        .select()
        .from(instructorInvites)
        .where(whereClause)
        .limit(1)
        .execute()
    );
  }

  static getOnePendingInviteByEmailAndDojoId(
    instructorEmail: string,
    dojoId: string,
    tx: Transaction
  ) {
    return this.findOneInstructorInvite({
      whereClause: and(
        eq(instructorInvites.email, instructorEmail),
        eq(instructorInvites.dojoId, dojoId),
        eq(instructorInvites.status, InstructorInviteStatus.Pending)
      ),
      tx,
    });
  }

  static fetchDojoUnacceptedInstructorInvites = async (
    dojoId: string,
    tx: Transaction
  ): Promise<IInstructorInvite[]> => {
    return await tx
      .select()
      .from(instructorInvites)
      .where(
        and(
          eq(instructorInvites.dojoId, dojoId),
          not(eq(instructorInvites.status, InstructorInviteStatus.Accepted))
        )
      )
      .execute();
  };
}
