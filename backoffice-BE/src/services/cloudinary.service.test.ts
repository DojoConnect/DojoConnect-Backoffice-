import { beforeEach, describe, expect, it, MockInstance, vi } from "vitest";
import { CloudinaryService } from "./cloudinary.service.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { CloudinaryResourceType } from "../constants/cloudinary.js";
import { BadRequestException } from "../core/errors/BadRequestException.js";


describe("CloudinaryService", () => {

    let fetchImageAssetSpy: MockInstance;

    beforeEach(() => {
        fetchImageAssetSpy = vi.spyOn(CloudinaryService, "fetchImageAsset").mockResolvedValue({
      resource_type: CloudinaryResourceType.IMAGE,
    } as any);
    });
  
  describe("assertValidImageAsset", () => {
    it("should not throw an error for a valid image", async () => {
      fetchImageAssetSpy.mockResolvedValue({
        resource_type: CloudinaryResourceType.IMAGE,
      } as any);

      await expect(CloudinaryService.assertValidImageAsset("valid-image-id")).resolves.not.toThrow();
    });

    it("should throw NotFoundException if asset is not found", async () => {
      fetchImageAssetSpy.mockResolvedValue(null);

      await expect(CloudinaryService.assertValidImageAsset("not-found-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException if asset is not an image", async () => {
      fetchImageAssetSpy.mockResolvedValue({
        resource_type: "video",
      } as any);

      await expect(CloudinaryService.assertValidImageAsset("video-id")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

});