import * as dbService from "../db/index.js";
import type { Transaction } from "../db/index.js";
import { Role } from "../constants/enums.js";
import { MessageRepository, type MessageWithSender } from "../repositories/message.repository.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { ClassEnrollmentRepository } from "../repositories/enrollment.repository.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { ParentRepository } from "../repositories/parent.repository.js";
import { InstructorsRepository } from "../repositories/instructors.repository.js";
import { DojoRepository } from "../repositories/dojo.repository.js";
import { ForbiddenException, NotFoundException } from "../core/errors/index.js";
import { getChatNamespace } from "../socket/index.js";
import { MessageDTO, PaginatedMessagesDTO } from "../dtos/chat.dtos.js";
import { ClassService } from "./class.service.js";

export interface SendMessageParams {
  classId: string;
  userId: string;
  userRole: Role;
  content: string;
}

export interface GetMessagesParams {
  classId: string;
  limit: number;
  cursor?: Date;
}

/**
 * MessageService handles all business logic for class group chat messages.
 *
 * Architecture Notes:
 * - HTTP REST is the source of truth for message creation
 * - Socket.IO is used only for real-time delivery (event emission)
 * - No Redis is used - this is a single-instance deployment
 *
 * UPGRADE PATH TO HORIZONTAL SCALING:
 * To support multiple backend instances, integrate @socket.io/redis-adapter:
 *
 * ```typescript
 * import { createAdapter } from "@socket.io/redis-adapter";
 * import { createClient } from "redis";
 *
 * const pubClient = createClient({ url: "redis://localhost:6379" });
 * const subClient = pubClient.duplicate();
 * await Promise.all([pubClient.connect(), subClient.connect()]);
 * io.adapter(createAdapter(pubClient, subClient));
 * ```
 *
 * This would allow Socket.IO events to be broadcasted across instances.
 */
export class MessageService {
  /**
   * Checks if a user can send messages to a class.
   * This is the single authorization function for class messaging.
   *
   * Authorization rules:
   * - DojoAdmin: Must own the dojo that the class belongs to
   * - Instructor: Must be assigned to the class
   * - Parent: Must have a child enrolled in the class
   * - Child: Must be enrolled in the class
   */
  static canSendClassMessage = async (
    userId: string,
    userRole: Role,
    classId: string,
    tx: Transaction,
  ): Promise<boolean> => {
    // First, verify the class exists
    const dojoClass = await ClassRepository.findById(classId, tx);
    if (!dojoClass) {
      return false;
    }

    switch (userRole) {
      case Role.DojoAdmin: {
        // Check if user owns the dojo that this class belongs to
        const dojo = await DojoRepository.getOneByID(dojoClass.dojoId, tx);
        return dojo?.ownerUserId === userId;
      }

      case Role.Instructor: {
        // Check if user is the assigned instructor for this class
        if (!dojoClass.instructorId) {
          return false;
        }
        const instructor = await InstructorsRepository.findOneByUserId(userId, tx);
        return instructor?.id === dojoClass.instructorId;
      }

      case Role.Parent: {
        // Check if user has any children enrolled in this class
        const parent = await ParentRepository.getOneParentByUserId(userId, tx);
        if (!parent) {
          return false;
        }

        const students = await StudentRepository.getStudentsByParentId(parent.id, tx);
        if (students.length === 0) {
          return false;
        }

        const studentIds = students.map((s) => s.student.id);
        const enrollments = await ClassEnrollmentRepository.fetchActiveEnrollmentsByStudentIds(
          studentIds,
          tx,
        );

        return enrollments.some((e) => e.classId === classId);
      }

      case Role.Child: {
        // Check if user (as student) is enrolled in the class
        const student = await StudentRepository.findOneByUserId(userId, tx);
        if (!student) {
          return false;
        }

        const enrollment = await ClassEnrollmentRepository.findOneActiveEnrollmentByClassIdAndStudentId(
          classId,
          student.id,
          tx,
        );

        return !!enrollment;
      }

      default:
        return false;
    }
  };

  static createMessage = async ({chatId, senderId, content}: {chatId: string, senderId: string, content: string}, txInstance?: Transaction): Promise<MessageWithSender> => {
    const execute = async (tx: Transaction) => {
      // Create the message
      const messageId = await MessageRepository.create(
        {
          chatId,
          senderId,
          content,
        },
        tx,
      );

      // Fetch the created message with sender info
      const message = await MessageRepository.findOneByIdWithSender(messageId, tx);
      if (!message) {
        throw new Error("Failed to retrieve created message");
      }

      return message;
    }

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  }

  static createClassGroupMessage = async ({classId, userId, userRole, content}: SendMessageParams, txInstance?: Transaction) => {
    const execute = async (tx: Transaction) => {
      
    }

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  }

  /**
   * Sends a message to a class group chat.
   * - Validates user membership
   * - Persists message to database
   * - Emits Socket.IO event for real-time delivery
   */
  static sendClassGroupMessage = async (
    params: SendMessageParams,
    txInstance?: Transaction,
  ): Promise<MessageDTO> => {
    const execute = async (tx: Transaction): Promise<MessageDTO> => {
      const { classId, userId, userRole, content } = params;

      // Verify class exists
      const dojoClass = await ClassRepository.findById(classId, tx);
      if (!dojoClass) {
        throw new NotFoundException(`Class with ID ${classId} not found`);
      }

      // Check authorization
      const canSend = await this.canSendClassMessage(userId, userRole, classId, tx);
      if (!canSend) {
        throw new ForbiddenException("You are not authorized to send messages in this class");
      }

      const message = await this.createMessage({chatId: dojoClass.chatId, senderId: userId, content}, tx);

      const messageDTO = this.toMessageDTO(message);

      // Emit Socket.IO event for real-time delivery
      // This runs after the transaction commits, but we do it here for simplicity
      // In a production setup, you might want to emit after tx commit confirmation
      try {
        const io = getChatNamespace();
        if (io) {
          io.to(`class:${classId}`).emit("message:new", messageDTO);
        }
      } catch {
        // Socket emission failure should not fail the message creation
        console.error("Failed to emit socket event for new message");
      }

      return messageDTO;
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  /**
   * Fetches messages for a class with cursor-based pagination.
   * Returns messages sorted by createdAt DESC (newest first).
   */
  static getMessages = async (
    params: GetMessagesParams,
    txInstance?: Transaction,
  ): Promise<PaginatedMessagesDTO> => {
    const execute = async (tx: Transaction): Promise<PaginatedMessagesDTO> => {
      const { classId, limit, cursor } = params;

      const dojoClass = await ClassService.getClassById(classId, tx);

      if (!dojoClass) {
        throw new NotFoundException(`Class with ID ${classId} not found`);
      }

      // Fetch one extra to determine if there are more results
      const messages = await MessageRepository.fetchByChatId(dojoClass.chatId, limit + 1, cursor, tx);

      const hasMore = messages.length > limit;
      const resultMessages = hasMore ? messages.slice(0, limit) : messages;

      const messageDTOs = resultMessages.map((m) => this.toMessageDTO(m, classId));

      const nextCursor =
        hasMore && resultMessages.length > 0
          ? resultMessages[resultMessages.length - 1].createdAt.toISOString()
          : null;

      return {
        messages: messageDTOs,
        nextCursor,
        hasMore,
      };
    };

    return txInstance ? execute(txInstance) : dbService.runInTransaction(execute);
  };

  /**
   * Converts a database message to a DTO.
   */
  private static toMessageDTO(message: MessageWithSender, classId?: string): MessageDTO {
    return {
      id: message.id,
      classId,
      senderId: message.senderId,
      senderName: `${message.sender.firstName} ${message.sender.lastName}`,
      senderAvatar: message.sender.avatar,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
