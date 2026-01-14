import { faker } from "@faker-js/faker";
import { Role } from "../../constants/enums.js";
import { UserDTO, UserDTOParams } from "../../dtos/user.dtos.js";
import { INewUser, IUser } from "../../repositories/user.repository.js";
import { INewUserCard, IUserCard } from "../../services/users.service.js";
import { BaseDojoDTO } from "../../dtos/dojo.dtos.js";
import { buildDojoMock } from "./dojos.factory.js";

export const buildUserMock = (overrides?: Partial<IUser>): IUser => {
  return {
    id: faker.string.uuid(),
    username: "john_d",
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: "john@example.com",
    passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$examplehashhere",
    avatar: "https://example.com/avatar.jpg",
    role: Role.DojoAdmin,
    emailVerified: true,
    dob: new Date("1990-05-14"),
    gender: "male",
    city: "Lagos",
    street: "42 Ikoyi Crescent",
    fcmToken: "fcm_token_example_8293hf2f",
    sessionId: "sess_8f2h9f23fh2",
    createdAt: new Date("2024-01-10T12:00:00"),
    ...overrides, // Allows overriding specific fields for different test scenarios
  };
};

export const buildUserCardMock = (
  overrides?: Partial<IUserCard>
): IUserCard => {
  return {
    id: "card_01JH8B9Z3P9A7XQ2KM4D8S1L0F", // 64-char max, can mimic uuidv7
    userId: "usr_01JH8A3Z9Q7X2TQPM8S4R1A9B7", // must match a user.id
    paymentMethodId: "pm_1N2aBcDeFgHiJkLmNoPqRsTu",
    brand: "visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2030,
    isDefault: true,
    createdAt: new Date("2024-01-10T12:00:00").toISOString(),
    ...overrides,
  };
};

export const buildNewUserMock = (overrides?: Partial<INewUser>): INewUser => {
  return {
    ...buildUserMock(overrides),
    ...overrides,
  };
};

export const buildNewUserCardMock = (
  overrides?: Partial<INewUserCard>
): INewUserCard => {
  return {
    ...buildUserCardMock(overrides),
    ...overrides,
  };
};

export const buildUserDtoMock = (
  overrides?: Partial<UserDTOParams>
): UserDTO => {
  return new UserDTO({ ...buildUserMock(overrides),  dojo: new BaseDojoDTO(buildDojoMock()) });
};
