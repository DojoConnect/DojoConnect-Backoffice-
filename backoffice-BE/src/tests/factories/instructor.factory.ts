import { faker } from "@faker-js/faker";
import { InstructorInviteStatus } from "../../constants/enums.js";
import { IDojoInstructor } from "../../repositories/instructors.repository.js";
import {
  IInstructorInvite,
  InstructorInviteDetails,
} from "../../repositories/invites.repository.js";
import {
  AcceptInviteDTO,
  InviteInstructorDTO,
} from "../../validations/instructors.schemas.js";
import { addDays } from "date-fns";

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

export const buildInviteDetailsMock = (
  overrides?: Partial<InstructorInviteDetails>
): InstructorInviteDetails => ({
  id: faker.string.uuid(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  status: InstructorInviteStatus.Pending,
  expiresAt: addDays(new Date(), 7),
  dojoId: faker.string.uuid(),
  dojoOwnerId: faker.string.uuid(),
  dojoName: "Test Dojo",
  className: null,
  invitedAt: new Date(),
  ...overrides,
});

export const buildAcceptInviteDTOMock = (
  overrides: Partial<AcceptInviteDTO>
): AcceptInviteDTO => {
  return {
    token: faker.string.alphanumeric(32),
    password: faker.internet.password(),
    ...overrides,
  };
};
