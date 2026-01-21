import { z } from "zod";
import { IsoDateTimeSchema } from "./helpers.schemas.js";

/**
 * Schema for sending a message in a class group chat.
 * Content must be non-empty text with max 2000 characters.
 */
export const SendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters"),
});

export type SendMessageDTO = z.infer<typeof SendMessageSchema>;

/**
 * Schema for query parameters when fetching messages.
 * Uses cursor-based pagination with ISO datetime cursor.
 */
export const GetMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: IsoDateTimeSchema.optional(),
});

export type GetMessagesQueryDTO = z.infer<typeof GetMessagesQuerySchema>;
