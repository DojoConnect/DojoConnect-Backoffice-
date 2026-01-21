import { ChatType } from "../constants/enums.js";
import { IUser } from "../repositories/user.repository.js";

export interface MessageDTO {
  id: string;
  classId?: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: string;
}

export interface PaginatedMessagesDTO {
  messages: MessageDTO[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateChatDTO {
  name?: string;
  type: ChatType; 
  createdBy: IUser;
}