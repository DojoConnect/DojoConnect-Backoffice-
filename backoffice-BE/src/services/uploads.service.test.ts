
import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from "vitest";
import { UploadService } from "./uploads.service.js";
import { DojosService } from "./dojos.service.js";
import { CloudinaryService } from "./cloudinary.service.js";
import { Role } from "../constants/enums.js";
import { UnauthorizedException } from "../core/errors/UnauthorizedException.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { ImageType } from "../constants/cloudinary.js";
import { buildUserMock } from "../tests/factories/user.factory.js";
import { buildDojoMock } from "../tests/factories/dojos.factory.js";
import { buildCloudinarySignatureMock } from "../tests/factories/uploads.factory.js";

// Mock dependencies
vi.mock("./dojos.service.js");
vi.mock("./cloudinary.service.js");

describe("UploadService", () => {
    const mockUser = buildUserMock({
        id: "user-123",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: Role.DojoAdmin,
    });

    const mockDojo = buildDojoMock({
        id: "dojo-123",
        name: "Test Dojo",
    });

    let getDojoSpy: MockInstance;
    let getCloudinarySignatureSpy: MockInstance;

    beforeEach(() => {
        vi.clearAllMocks();
        getDojoSpy = vi.spyOn(DojosService, "fetchUserDojo").mockResolvedValue(mockDojo);
        getCloudinarySignatureSpy = vi.spyOn(CloudinaryService, "getCloudinarySignature").mockReturnValue(buildCloudinarySignatureMock({
            signature: "test-signature",
            timestamp: 123456789,
            apiKey: "test-api-key",
        }));
    });

    describe("generateClassImageUploadSignature", () => {
        it("should throw UnauthorizedException if user is not DojoAdmin", async () => {
            const unauthorizedUser = buildUserMock({ role: Role.Parent });

            await expect(UploadService.generateClassImageUploadSignature(unauthorizedUser))
                .rejects
                .toThrow(UnauthorizedException);
        });

        it("should throw NotFoundException if user dojo is not found", async () => {
            getDojoSpy.mockResolvedValue(null);

            await expect(UploadService.generateClassImageUploadSignature(mockUser))
                .rejects
                .toThrow(NotFoundException);
            
            expect(getDojoSpy).toHaveBeenCalledWith({ user: mockUser });
        });

        it("should return cloudinary signature if user is authorized and dojo exists", async () => {
            getDojoSpy.mockResolvedValue(mockDojo as any);
            const mockSignature = buildCloudinarySignatureMock({
                signature: "test-signature",
                timestamp: 123456789,
                apiKey: "test-api-key",
            });
            getCloudinarySignatureSpy.mockReturnValue(mockSignature);

            const result = await UploadService.generateClassImageUploadSignature(mockUser);

            expect(getDojoSpy).toHaveBeenCalledWith({ user: mockUser });
            expect(getCloudinarySignatureSpy).toHaveBeenCalledWith({
                imageType: ImageType.CLASS,
                context: `dojoId=${mockDojo.id}|imageType=${ImageType.CLASS}`,
                uploadFolder: `dojos/classes/tmp`,
            });
            expect(result).toEqual(mockSignature);
        });
    });

    describe("generateProfileImageUploadSignature", () => {
        it("should return cloudinary signature for profile image", async () => {
            const mockSignature = buildCloudinarySignatureMock({
                signature: "test-profile-signature",
                timestamp: 987654321,
                apiKey: "test-api-key",
            });
            getCloudinarySignatureSpy.mockReturnValue(mockSignature);

            const result = await UploadService.generateProfileImageUploadSignature(mockUser);

            expect(getCloudinarySignatureSpy).toHaveBeenCalledWith({
                imageType: ImageType.AVATAR,
                context: `userId=${mockUser.id}|imageType=${ImageType.AVATAR}`,
                uploadFolder: `users/avatars/tmp`,
            });
            expect(result).toEqual(mockSignature);
        });
    });
});
