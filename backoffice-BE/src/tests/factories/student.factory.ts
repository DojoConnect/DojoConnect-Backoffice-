import { faker } from "@faker-js/faker";
import { IStudent } from "../../repositories/student.repository.js";
import { ExperienceLevel } from "../../constants/enums.js";

export const buildStudentMock = (overrides?: Partial<IStudent>): IStudent => {
  return {
    id: faker.string.uuid(),
    studentUserId: faker.string.uuid(),
    parentId: faker.string.uuid(),
    experienceLevel: ExperienceLevel.Beginner,
    createdAt: new Date("2024-01-10T12:00:00").toISOString(),
    ...overrides,
  };
};