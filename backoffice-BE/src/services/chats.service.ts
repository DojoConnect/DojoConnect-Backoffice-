import { ChatType } from "../constants/enums.js";
import { Transaction } from "../db/index.js";
import * as dbService from "../db/index.js";
import { CreateChatDTO } from "../dtos/chat.dtos.js";
import { ChatRepository } from "../repositories/chat.repository.js";
import { IUser } from "../repositories/user.repository.js";
import { MessageService } from "./message.service.js";

export class ChatsService {
    static createChat = async (dto: CreateChatDTO, txInstance?: Transaction): Promise<string> => {
        const execute = async (tx: Transaction) => {
            return await ChatRepository.create(
                {
                    type: dto.type,
                    name: dto.name,
                    createdBy: dto.createdBy.id,
                },
                tx,
            );
        }

        return txInstance? execute(txInstance) : dbService.runInTransaction(execute);
    }   

    static createClassGroupChat = async (
        dojoOwner: IUser,
     txInstance?: Transaction) => {
        const execute = async (tx: Transaction) => {
            // Create Chat
            const chatId = await ChatsService.createChat({
                    type: ChatType.ClassGroup,
                    createdBy: dojoOwner,
                  }, tx);

            // Add Owner as participant
            await ChatRepository.addParticipant(
                {
                    chatId,
                    userId: dojoOwner.id,
                },
                tx,
            );

            await MessageService.createMessage({
                chatId,
                senderId: dojoOwner.id,
                content: `Welcome to your class group chat!`,
            }, tx);

            return chatId;
        }

        return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
    }

    static addInstructorToChat = async ({chatId, dojoOwner, instructor}: {chatId: string, dojoOwner: IUser, instructor: IUser}, txInstance?: Transaction) => {
        const execute = async (tx: Transaction) => {
            await ChatRepository.addParticipant(
                {
                    chatId,
                    userId: instructor.id,
                },
                tx,
            );

            await MessageService.createMessage({
                chatId,
                senderId: dojoOwner.id,
                content: `${instructor.firstName} joined the group as Instructor.`,
            }, tx);
        }

        return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
    }
}