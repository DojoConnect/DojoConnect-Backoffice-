import { faker } from "@faker-js/faker";
import { IClassEnrollment } from "../../repositories/enrollment.repository.js";

export const buildEnrollmentMock = (
  overrides?: Partial<IClassEnrollment>
): IClassEnrollment => {
  return {
    id: faker.string.uuid(),
    studentId: faker.string.uuid(),
    classId: faker.string.uuid(),
    active: true,
    createdAt: new Date("2024-01-10T12:00:00"),
    updatedAt: new Date("2024-01-10T12:00:00"),
    revokedAt: null, 
    ...overrides,
  };
};