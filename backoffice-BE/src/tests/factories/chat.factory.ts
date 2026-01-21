import { faker } from "@faker-js/faker";
import { IChat, IChatParticipant } from "../../repositories/chat.repository.js";
import { ChatType } from "../../constants/enums.js";

export const buildChatMock = (overrides?: Partial<IChat>): IChat => {
  return {
    id: faker.string.uuid(),
    type: ChatType.ClassGroup,
    name: faker.lorem.words(2),
    createdBy: faker.string.uuid(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
};

export const buildChatParticipantMock = (overrides?: Partial<IChatParticipant>): IChatParticipant => {
  return {
    id: faker.string.uuid(),
    chatId: faker.string.uuid(),
    userId: faker.string.uuid(),
    joinedAt: new Date(),
    leftAt: null,
    ...overrides,
  };
};
