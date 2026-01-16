import { faker } from "@faker-js/faker";
import { IParent } from "../../repositories/parent.repository.js";

export const buildParentMock = (overrides?: Partial<IParent>): IParent => {
    return {
        id: faker.string.uuid(),
        userId: faker.string.uuid(),
        stripeCustomerId: faker.string.uuid(),
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.past().toISOString(),
        ...overrides,
    }
}