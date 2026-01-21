import { Request, Response } from "express";
import { MessageService } from "../services/message.service.js";
import { Role } from "../constants/enums.js";
import type { SendMessageDTO, GetMessagesQueryDTO } from "../validations/message.schemas.js";

/**
 * MessageController handles HTTP requests for class group chat messages.
 *
 * REST is the source of truth for message operations.
 * Socket.IO is used only for real-time delivery of new messages.
 */
export class MessageController {
  /**
   * POST /classes/:classId/messages
   *
   * Sends a new message to a class group chat.
   * Requires authentication and class membership.
   *
   * Response: 201 Created with the created message
   */
  static sendMessage = async (req: Request, res: Response): Promise<void> => {
    const classId = req.params.classId as string;
    const { content } = req.body as SendMessageDTO;
    const user = req.user!;

    const message = await MessageService.sendClassGroupMessage({
      classId,
      userId: user.id,
      userRole: user.role as Role,
      content,
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  };

  /**
   * GET /classes/:classId/messages
   *
   * Fetches messages for a class with cursor-based pagination.
   * Returns messages sorted by createdAt DESC (newest first).
   *
   * Query params:
   * - limit: number (1-100, default 50)
   * - cursor: ISO datetime string (optional, for pagination)
   *
   * Response: 200 OK with paginated messages
   */
  static getMessages = async (req: Request, res: Response): Promise<void> => {
    const classId = req.params.classId as string;
    const { limit, cursor } = req.query as unknown as GetMessagesQueryDTO;

    const result = await MessageService.getMessages({
      classId,
      limit,
      cursor,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  };
}

