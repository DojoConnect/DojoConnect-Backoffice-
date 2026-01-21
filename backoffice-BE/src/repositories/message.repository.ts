import { and, desc, eq, InferInsertModel, InferSelectModel, lt, SQL } from "drizzle-orm";
import { messages, users } from "../db/schema.js";
import { Transaction } from "../db/index.js";
import { returnFirst } from "../utils/db.utils.js";

export type IMessage = InferSelectModel<typeof messages>;
export type INewMessage = InferInsertModel<typeof messages>;

export interface MessageWithSender extends IMessage {
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export class MessageRepository {
  /**
   * Creates a new message.
   */
  static create = async (data: INewMessage, tx: Transaction): Promise<string> => {
    const [insertResult] = await tx.insert(messages).values(data).$returningId();
    return insertResult.id;
  };

  /**
   * Finds a message by ID.
   */
  static findById = async (messageId: string, tx: Transaction): Promise<IMessage | null> => {
    return returnFirst(await tx.select().from(messages).where(eq(messages.id, messageId)).limit(1));
  };

  /**
   * Finds a message by ID with sender information.
   */
  static findOneByIdWithSender = async (
    messageId: string,
    tx: Transaction,
  ): Promise<MessageWithSender | null> => {
    const result = returnFirst(
      await tx
        .select({
          id: messages.id,
          chatId: messages.chatId,
          senderId: messages.senderId,
          content: messages.content,
          createdAt: messages.createdAt,
          sender: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            avatar: users.avatar,
          },
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.id, messageId))
        .limit(1),
    );

    return result || null;
  };

  static fetchMany = async ({
    whereClause,
    limit,
    cursor,
  }: {
    whereClause: SQL,
    limit: number,
    cursor: Date | undefined,
    }, tx: Transaction) => {
      const whereConditions = cursor
      ? and(whereClause, lt(messages.createdAt, cursor))
      : whereClause;

    return await tx
      .select({
        id: messages.id,
        chatId: messages.chatId,
        senderId: messages.senderId,
        content: messages.content,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(whereConditions)
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    }

  /**
   * Fetches messages for a chat with cursor-based pagination.
   * Returns messages sorted by createdAt DESC (newest first).
   *
   * @param chatId - The chat ID to fetch messages for
   * @param limit - Maximum number of messages to return
   * @param cursor - ISO datetime string to fetch messages before (optional)
   * @param tx - Database transaction
   */
  static fetchByChatId = async (
    chatId: string,
    limit: number,
    cursor: Date | undefined,
    tx: Transaction,
  ): Promise<MessageWithSender[]> => {
    return this.fetchMany({
      whereClause: eq(messages.chatId, chatId),
      limit,
      cursor,
    }, tx); 
  };
}
