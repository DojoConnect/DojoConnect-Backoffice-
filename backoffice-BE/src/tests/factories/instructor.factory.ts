import { faker } from "@faker-js/faker";
import { InstructorInviteStatus } from "../../constants/enums.js";
import { IDojoInstructor } from "../../repositories/instructors.repository.js";
import { IInstructorInvite } from "../../repositories/invites.repository.js";
import { InviteInstructorDTO } from "../../validations/instructors.schemas.js";

export const buildInstructorInviteMock = (
  overrides?: Partial<IInstructorInvite>
): IInstructorInvite => {
  return {
    id: faker.string.uuid(),
    dojoId: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    classId: null,
    tokenHash: faker.string.alphanumeric(32),
    expiresAt: faker.date.future(),
    respondedAt: null,
    status: InstructorInviteStatus.Pending,
    invitedBy: faker.string.uuid(),
    createdAt: faker.date.past(),
    ...overrides,
  };
};

export const buildInstructorMock = (
  overrides?: Partial<IDojoInstructor>
): IDojoInstructor => {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    dojoId: faker.string.uuid(),
    createdAt: new Date(),
    ...overrides,
  };
};

export const buildInviteInstructorDtoMock = (
  overrides?: Partial<InviteInstructorDTO>
): InviteInstructorDTO => {
  return {
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    classId: null,
    ...overrides,
  };
};