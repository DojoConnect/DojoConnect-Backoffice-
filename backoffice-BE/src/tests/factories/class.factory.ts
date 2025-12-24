import { faker } from "@faker-js/faker";
import { IClass } from "../../repositories/class.repository.js";
import { ClassLevel, ClassStatus } from "../../constants/enums.js";

export const buildClassMock = (
  overrides: Partial<IClass> = {}
): IClass => {
    return {
    id: faker.string.uuid(),
    dojoId: faker.string.uuid(),
    description: faker.lorem.sentence(),
    createdAt: new Date(),
    className: faker.lorem.words(2),
    classUid: faker.string.uuid(),
    instructorId: faker.string.uuid(),
    ownerEmail: faker.internet.email(),
    level: ClassLevel.Beginner,
    ageGroup: "10-15",
    frequency: "Weekly",
    capacity: 20,
    city: faker.location.city(),
    streetAddress: faker.location.streetAddress(),
    status: ClassStatus.Active,
    updatedAt: new Date(),
    imagePath: faker.image.url(),
    location: faker.location.city(),
    subscription: faker.string.uuid(),
    stripePriceId: faker.string.uuid(),
    stripeProductId: faker.string.uuid(),
    price: "100.00",
    chatId: faker.number.int({ min: 100000, max: 999999 }),
    ...overrides,
    }
}