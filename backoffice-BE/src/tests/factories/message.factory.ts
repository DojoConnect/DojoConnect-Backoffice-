import { faker } from "@faker-js/faker";
import { IMessage, MessageWithSender } from "../../repositories/message.repository.js";
import { buildUserMock } from "./user.factory.js";

export const buildMessageMock = (overrides?: Partial<IMessage>): IMessage => {
  return {
    id: faker.string.uuid(),
    chatId: faker.string.uuid(),
    senderId: faker.string.uuid(),
    content: faker.lorem.sentence(),
    createdAt: new Date(),
    ...overrides,
  };
};

export const buildMessageWithSenderMock = (overrides?: Partial<MessageWithSender>): MessageWithSender => {
  const user = buildUserMock();
  return {
    ...buildMessageMock(),
    sender: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatarPublicId,
    },
    ...overrides,
  } as MessageWithSender;
};
