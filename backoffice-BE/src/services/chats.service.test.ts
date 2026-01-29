import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from "vitest";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies.js";
import { ChatsService } from "./chats.service.js";
import { ChatRepository } from "../repositories/chat.repository.js";
import { MessageService } from "./message.service.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import { ChatType } from "../constants/enums.js";

vi.mock("../repositories/chat.repository.js");
vi.mock("./message.service.js");

describe("Chats Service", () => {
  let dbServiceSpy: DbServiceSpies;

  // Spies
  let chatCreateSpy: MockInstance;
  let chatAddParticipantSpy: MockInstance;
  let messageCreateSpy: MockInstance;

  beforeEach(() => {
    dbServiceSpy = createDrizzleDbSpies();
    
    chatCreateSpy = vi.spyOn(ChatRepository, "create");
    chatAddParticipantSpy = vi.spyOn(ChatRepository, "addParticipant");
    messageCreateSpy = vi.spyOn(MessageService, "createMessage");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createChat", () => {
    it("should successfully create a chat", async () => {
      const user = buildUserMock();
      const chatId = "chat-123";
      chatCreateSpy.mockResolvedValue(chatId);

      const result = await ChatsService.createChat({
        type: ChatType.DM,
        name: "Direct Chat",
        createdBy: user,
      });

      expect(result).toBe(chatId);
      expect(chatCreateSpy).toHaveBeenCalledWith(
        {
          type: ChatType.DM,
          name: "Direct Chat",
          createdBy: user.id,
        },
        dbServiceSpy.mockTx
      );
    });
  });

  describe("createClassGroupChat", () => {
    it("should successfully create a class group chat, add owner and welcome message", async () => {
      const dojoOwner = buildUserMock();
      const chatId = "class-chat-123";
      
      // Mock createChat (internal call but mocked via ChatRepository.create)
      chatCreateSpy.mockResolvedValue(chatId);
      chatAddParticipantSpy.mockResolvedValue("participant-id");
      messageCreateSpy.mockResolvedValue({} as any);

      const result = await ChatsService.createClassGroupChat(dojoOwner);

      expect(result).toBe(chatId);
      expect(chatCreateSpy).toHaveBeenCalled();
      expect(chatAddParticipantSpy).toHaveBeenCalledWith(
        {
          chatId,
          userId: dojoOwner.id,
        },
        dbServiceSpy.mockTx
      );
      expect(messageCreateSpy).toHaveBeenCalledWith(
        {
          chatId,
          senderId: dojoOwner.id,
          content: "Welcome to your class group chat!",
        },
        dbServiceSpy.mockTx
      );
    });
  });

  describe("addInstructorToChat", () => {
    it("should successfully add instructor to chat and send message", async () => {
      const dojoOwner = buildUserMock();
      const instructor = buildUserMock({ firstName: "Sensei" });
      const chatId = "class-chat-123";

      chatAddParticipantSpy.mockResolvedValue("participant-id");
      messageCreateSpy.mockResolvedValue({} as any);

      await ChatsService.addInstructorToChat({
        chatId,
        dojoOwner,
        instructor,
      });

      expect(chatAddParticipantSpy).toHaveBeenCalledWith(
        {
          chatId,
          userId: instructor.id,
        },
        dbServiceSpy.mockTx
      );
      expect(messageCreateSpy).toHaveBeenCalledWith(
        {
          chatId,
          senderId: dojoOwner.id,
          content: "Sensei joined the group as Instructor.",
        },
        dbServiceSpy.mockTx
      );
    });
  });
});
