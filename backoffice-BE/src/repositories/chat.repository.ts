import { and, eq, InferInsertModel, InferSelectModel, SQL, isNull } from "drizzle-orm";
import { chats, chatParticipants } from "../db/schema.js";
import { Transaction } from "../db/index.js";
import { returnFirst } from "../utils/db.utils.js";

export type IChat = InferSelectModel<typeof chats>;
export type INewChat = InferInsertModel<typeof chats>;
export type IChatParticipant = InferSelectModel<typeof chatParticipants>;
export type INewChatParticipant = InferInsertModel<typeof chatParticipants>;

export class ChatRepository {
  /**
   * Creates a new chat record.
   */
  static create = async (data: INewChat, tx: Transaction): Promise<string> => {
    const [insertResult] = await tx.insert(chats).values(data).$returningId();
    return insertResult.id;
  };

  /**
   * Finds a chat by ID.
   */
  static findById = async (chatId: string, tx: Transaction): Promise<IChat | null> => {
    return returnFirst(await tx.select().from(chats).where(eq(chats.id, chatId)).limit(1));
  };

  /**
   * Adds a participant to a chat.
   */
  static addParticipant = async (data: INewChatParticipant, tx: Transaction): Promise<string> => {
    const [insertResult] = await tx.insert(chatParticipants).values(data).$returningId();
    return insertResult.id;
  };

  /**
   * Finds active participants in a chat.
   */
  static findActiveParticipants = async (
    chatId: string,
    tx: Transaction,
  ): Promise<IChatParticipant[]> => {
    return await tx
      .select()
      .from(chatParticipants)
      .where(and(eq(chatParticipants.chatId, chatId), isNull(chatParticipants.leftAt)));
  };

  /**
   * Checks if a user is an active participant in a chat.
   */
  static isParticipant = async (
    chatId: string,
    userId: string,
    tx: Transaction,
  ): Promise<boolean> => {
    const participant = returnFirst(
      await tx
        .select()
        .from(chatParticipants)
        .where(
          and(
            eq(chatParticipants.chatId, chatId),
            eq(chatParticipants.userId, userId),
            isNull(chatParticipants.leftAt),
          ),
        )
        .limit(1),
    );

    return !!participant;
  };
}
