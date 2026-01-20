import { and, eq, InferInsertModel, InferSelectModel, not, SQL } from "drizzle-orm";
import { Transaction } from "../db/index.js";
import { classes, dojos, instructorInvites } from "../db/schema.js";
import { returnFirst } from "../utils/db.utils.js";
import { InstructorInviteStatus } from "../constants/enums.js";

export type IInstructorInvite = InferSelectModel<typeof instructorInvites>;
export type INewInstructorInvite = InferInsertModel<typeof instructorInvites>;
export type IUpdateInstructorInvite = Partial<Omit<INewInstructorInvite, "id" | "createdAt">>;

export interface InstructorInviteDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: InstructorInviteStatus;
  expiresAt: Date;
  dojoId: string;
  dojoName: string;
  dojoOwnerId: string;
  className: string | null;
  invitedAt: Date;
}

export class InvitesRepository {
  static createInstructorInvite = async (invite: INewInstructorInvite, tx: Transaction) => {
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
      await tx.select().from(instructorInvites).where(whereClause).limit(1).execute(),
    );
  }

  static getOneInstructorInviteByTokenHash(tokenHash: string, tx: Transaction) {
    return this.findOneInstructorInvite({
      whereClause: eq(instructorInvites.tokenHash, tokenHash),
      tx,
    });
  }

  static getOnePendingInviteByEmailAndDojoId(
    instructorEmail: string,
    dojoId: string,
    tx: Transaction,
  ) {
    return this.findOneInstructorInvite({
      whereClause: and(
        eq(instructorInvites.email, instructorEmail),
        eq(instructorInvites.dojoId, dojoId),
        eq(instructorInvites.status, InstructorInviteStatus.Pending),
      ),
      tx,
    });
  }

  static fetchDojoUnacceptedInstructorInvites = async (
    dojoId: string,
    tx: Transaction,
  ): Promise<IInstructorInvite[]> => {
    return await tx
      .select()
      .from(instructorInvites)
      .where(
        and(
          eq(instructorInvites.dojoId, dojoId),
          not(eq(instructorInvites.status, InstructorInviteStatus.Accepted)),
        ),
      )
      .execute();
  };

  static getInviteDetails = async (
    tokenHash: string,
    tx: Transaction,
  ): Promise<InstructorInviteDetails | null> => {
    const result = await tx
      .select({
        id: instructorInvites.id,
        firstName: instructorInvites.firstName,
        lastName: instructorInvites.lastName,
        email: instructorInvites.email,
        status: instructorInvites.status,
        expiresAt: instructorInvites.expiresAt,
        dojoId: dojos.id, // join with dojos table
        dojoName: dojos.name, // join with dojos table
        className: classes.name, // join with classes table if classId exists
        dojoOwnerId: dojos.ownerUserId,
        invitedAt: instructorInvites.createdAt,
      })
      .from(instructorInvites)
      .innerJoin(dojos, eq(instructorInvites.dojoId, dojos.id))
      .leftJoin(classes, eq(instructorInvites.classId, classes.id))
      .where(eq(instructorInvites.tokenHash, tokenHash))
      .limit(1)
      .execute();

    return returnFirst(result);
  };

  static markInviteAsExpired = async (inviteId: string, tx: Transaction): Promise<void> => {
    await tx
      .update(instructorInvites)
      .set({ status: InstructorInviteStatus.Expired })
      .where(eq(instructorInvites.id, inviteId))
      .execute();
  };

  static markInviteAsResponded = async (
    inviteId: string,
    response: InstructorInviteStatus.Accepted | InstructorInviteStatus.Declined,
    tx: Transaction,
  ): Promise<void> => {
    await tx
      .update(instructorInvites)
      .set({ status: response, respondedAt: new Date() })
      .where(eq(instructorInvites.id, inviteId))
      .execute();
  };
}
