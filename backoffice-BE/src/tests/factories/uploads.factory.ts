import { faker } from "@faker-js/faker";
import { ICloudinarySignature } from "../../services/cloudinary.service.js";

export const buildCloudinarySignatureMock = (overrides?: Partial<ICloudinarySignature>): ICloudinarySignature => {
    return {
        cloudName: faker.string.uuid(),
        apiKey: faker.string.uuid(),
        timestamp: faker.number.int(),
        signature: faker.string.uuid(),
        asset_folder: faker.string.uuid(),
        allowed_formats: ["jpg", "png", "gif"],
        max_file_size: 1024 * 1024 * 5,
        transformation: faker.string.uuid(),
        upload_preset: faker.string.uuid(),
        context: faker.string.uuid(),
        ...overrides,
    };
};