import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from "vitest";
import { createDrizzleDbSpies, DbServiceSpies } from "../tests/spies/drizzle-db.spies.js";
import { MessageService } from "./message.service.js";
import { MessageRepository } from "../repositories/message.repository.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { DojoRepository } from "../repositories/dojo.repository.js";
import { InstructorsRepository } from "../repositories/instructors.repository.js";
import { ParentRepository } from "../repositories/parent.repository.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { ClassEnrollmentRepository } from "../repositories/enrollment.repository.js";
import { Role } from "../constants/enums.js";
import { buildClassMock } from "../tests/factories/class.factory.js";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";
import { buildInstructorMock } from "../tests/factories/instructor.factory.js";
import { buildParentMock } from "../tests/factories/parent.factory.js";
import { buildStudentMock } from "../tests/factories/student.factory.js";
import { buildMessageWithSenderMock } from "../tests/factories/message.factory.js";
import { NotFoundException, ForbiddenException } from "../core/errors/index.js";
import * as socketUtils from "../socket/index.js";
import { buildEnrollmentMock } from "../tests/factories/enrollment.factory.js";

vi.mock("../repositories/message.repository.js");
vi.mock("../repositories/class.repository.js");
vi.mock("../repositories/dojo.repository.js");
vi.mock("../repositories/instructors.repository.js");
vi.mock("../repositories/parent.repository.js");
vi.mock("../repositories/student.repository.js");
vi.mock("../repositories/enrollment.repository.js");
vi.mock("../socket/index.js");

describe("Message Service", () => {
  let dbServiceSpy: DbServiceSpies;

  beforeEach(() => {
    dbServiceSpy = createDrizzleDbSpies();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("canSendClassMessage", () => {
    const classId = "class-123";
    const userId = "user-123";

    it("should return false if class does not exist", async () => {
      vi.spyOn(ClassRepository, "findById").mockResolvedValue(null);
      const result = await MessageService.canSendClassMessage(userId, Role.DojoAdmin, classId, dbServiceSpy.mockTx);
      expect(result).toBe(false);
    });

    describe("DojoAdmin", () => {
      it("should return true if user owns the dojo", async () => {
        const dojoClass = buildClassMock({ id: classId, dojoId: "dojo-1" });
        const dojo = buildDojoMock({ id: "dojo-1", ownerUserId: userId });
        
        vi.spyOn(ClassRepository, "findById").mockResolvedValue(dojoClass);
        vi.spyOn(DojoRepository, "getOneByID").mockResolvedValue(dojo);

        const result = await MessageService.canSendClassMessage(userId, Role.DojoAdmin, classId, dbServiceSpy.mockTx);
        expect(result).toBe(true);
      });

      it("should return false if user does not own the dojo", async () => {
        const dojoClass = buildClassMock({ id: classId, dojoId: "dojo-1" });
        const dojo = buildDojoMock({ id: "dojo-1", ownerUserId: "other-user" });
        
        vi.spyOn(ClassRepository, "findById").mockResolvedValue(dojoClass);
        vi.spyOn(DojoRepository, "getOneByID").mockResolvedValue(dojo);

        const result = await MessageService.canSendClassMessage(userId, Role.DojoAdmin, classId, dbServiceSpy.mockTx);
        expect(result).toBe(false);
      });
    });

    describe("Instructor", () => {
      it("should return true if user is the assigned instructor", async () => {
        const instructorId = "instructor-1";
        const dojoClass = buildClassMock({ id: classId, instructorId });
        const instructor = buildInstructorMock({ id: instructorId, instructorUserId: userId });
        
        vi.spyOn(ClassRepository, "findById").mockResolvedValue(dojoClass);
        vi.spyOn(InstructorsRepository, "findOneByUserId").mockResolvedValue(instructor);

        const result = await MessageService.canSendClassMessage(userId, Role.Instructor, classId, dbServiceSpy.mockTx);
        expect(result).toBe(true);
      });

      it("should return false if class has no instructor", async () => {
        const dojoClass = buildClassMock({ id: classId, instructorId: null });
        vi.spyOn(ClassRepository, "findById").mockResolvedValue(dojoClass);

        const result = await MessageService.canSendClassMessage(userId, Role.Instructor, classId, dbServiceSpy.mockTx);
        expect(result).toBe(false);
      });
    });

    describe("Parent", () => {
      it("should return true if child is enrolled", async () => {
        const parentId = "parent-1";
        const studentId = "student-1";
        const dojoClass = buildClassMock({ id: classId });
        const parent = buildParentMock({ id: parentId, userId });
        const student = buildStudentMock({ id: studentId, parentId });
        
        vi.spyOn(ClassRepository, "findById").mockResolvedValue(dojoClass);
        vi.spyOn(ParentRepository, "getOneParentByUserId").mockResolvedValue(parent);
        vi.spyOn(StudentRepository, "getStudentsByParentId").mockResolvedValue([{ student }]);
        vi.spyOn(ClassEnrollmentRepository, "fetchActiveEnrollmentsByStudentIds").mockResolvedValue([buildEnrollmentMock({ studentId, classId })]);

        const result = await MessageService.canSendClassMessage(userId, Role.Parent, classId, dbServiceSpy.mockTx);
        expect(result).toBe(true);
      });
    });

    describe("Child", () => {
      it("should return true if student is enrolled", async () => {
        const studentId = "student-1";
        const dojoClass = buildClassMock({ id: classId });
        const student = buildStudentMock({ id: studentId, studentUserId: userId });
        
        vi.spyOn(ClassRepository, "findById").mockResolvedValue(dojoClass);
        vi.spyOn(StudentRepository, "findOneByUserId").mockResolvedValue(student);
        vi.spyOn(ClassEnrollmentRepository, "findOneActiveEnrollmentByClassIdAndStudentId").mockResolvedValue({ studentId, classId } as any);

        const result = await MessageService.canSendClassMessage(userId, Role.Child, classId, dbServiceSpy.mockTx);
        expect(result).toBe(true);
      });
    });
  });

  describe("createMessage", () => {
    it("should successfully create a message", async () => {
      const chatId = "chat-123";
      const senderId = "sender-123";
      const content = "Hello World";
      const messageId = "msg-123";
      const mockMessage = buildMessageWithSenderMock({ id: messageId, chatId, senderId, content });

      vi.spyOn(MessageRepository, "create").mockResolvedValue(messageId);
      vi.spyOn(MessageRepository, "findOneByIdWithSender").mockResolvedValue(mockMessage);

      const result = await MessageService.createMessage({ chatId, senderId, content });

      expect(result).toEqual(mockMessage);
      expect(MessageRepository.create).toHaveBeenCalledWith({ chatId, senderId, content }, dbServiceSpy.mockTx);
    });

    it("should throw error if message retrieval fails after creation", async () => {
      vi.spyOn(MessageRepository, "create").mockResolvedValue("id");
      vi.spyOn(MessageRepository, "findOneByIdWithSender").mockResolvedValue(null);

      await expect(MessageService.createMessage({ chatId: "c", senderId: "s", content: "m" })).rejects.toThrow("Failed to retrieve created message");
    });
  });

  describe("sendClassGroupMessage", () => {
    it("should throw NotFoundException if class does not exist", async () => {
      vi.spyOn(ClassRepository, "findById").mockResolvedValue(null);
      await expect(MessageService.sendClassGroupMessage({ classId: "1", userId: "1", userRole: Role.Child, content: "m" }))
        .rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if user cannot send message", async () => {
      vi.spyOn(ClassRepository, "findById").mockResolvedValue(buildClassMock());
      vi.spyOn(MessageService, "canSendClassMessage").mockResolvedValue(false);
      
      await expect(MessageService.sendClassGroupMessage({ classId: "1", userId: "1", userRole: Role.Child, content: "m" }))
        .rejects.toThrow(ForbiddenException);
    });

    it("should create message and emit socket event", async () => {
      const classId = "class-123";
      const chatId = "chat-123";
      const dojoClass = buildClassMock({ id: classId, chatId });
      const mockMessage = buildMessageWithSenderMock({ chatId });
      const mockEmit = vi.fn();

      vi.spyOn(ClassRepository, "findById").mockResolvedValue(dojoClass);
      vi.spyOn(MessageService, "canSendClassMessage").mockResolvedValue(true);
      vi.spyOn(MessageService, "createMessage").mockResolvedValue(mockMessage);
      vi.spyOn(socketUtils, "getChatNamespace").mockReturnValue({ to: () => ({ emit: mockEmit }) } as any);

      const result = await MessageService.sendClassGroupMessage({ classId, userId: "u", userRole: Role.Child, content: "Hello" });

      expect(result.content).toBe(mockMessage.content);
      expect(mockEmit).toHaveBeenCalledWith("message:new", expect.any(Object));
    });
  });

  describe("getMessages", () => {
    it("should return paginated messages", async () => {
      const classId = "class-123";
      const chatId = "chat-123";
      const dojoClass = buildClassMock({ id: classId, chatId });
      const mockMessages = [
        buildMessageWithSenderMock({ chatId }),
        buildMessageWithSenderMock({ chatId }),
      ];

      vi.spyOn(ClassRepository, "findById").mockResolvedValue(dojoClass);
      vi.spyOn(MessageRepository, "fetchByChatId").mockResolvedValue(mockMessages);

      const result = await MessageService.getMessages({ classId, limit: 1 });

      expect(result.messages).toHaveLength(1);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });
  });
});
