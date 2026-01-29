import { v2 as cloudinary } from "cloudinary";
import AppConfig from "../config/AppConfig.js";
import {
  ALLOWED_FORMATS,
  CloudinaryResourceType,
  IMAGE_TRANSFORMATIONS,
  ImageType,
  MAX_FILE_SIZE_BYTES,
  UPLOAD_PRESETS,
} from "../constants/cloudinary.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";
import { NotFoundException } from "../core/errors/NotFoundException.js";
import { BadRequestException } from "../core/errors/BadRequestException.js";

export interface ICloudinarySignature {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    asset_folder: string;
    allowed_formats: string[];
    max_file_size: number;
    transformation: string;
    upload_preset: string;
    context: string;
}

// Maps image types to their corresponding Cloudinary folder paths.
const FOLDER_MAP: Record<ImageType, string> = {
  [ImageType.CLASS]: "dojos/{id}/class",
  [ImageType.AVATAR]: "users/{id}/avatar",
};

const getFinalUploadFolder = (imageType: ImageType, entityId: string) => {
  return FOLDER_MAP[imageType].replace("{id}", entityId);
};

export class CloudinaryService {
  // Generates a signed upload signature for Cloudinary.
  static getCloudinarySignature = ({imageType, context, uploadFolder}: {imageType: ImageType, context: string, uploadFolder: string}): ICloudinarySignature => {
    if (!IMAGE_TRANSFORMATIONS[imageType]) {
      throw new InternalServerErrorException(`Unsupported image type: ${imageType}`);
    }

    const asset_folder = uploadFolder;
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Defines the transformation to be applied to the uploaded image.
    const transformation = IMAGE_TRANSFORMATIONS[imageType];

    const upload_preset = UPLOAD_PRESETS.general_signed_image_upload;

    // Creates a signature for the upload request.
    const signature = cloudinary.utils.api_sign_request(
      {
        allowed_formats: ALLOWED_FORMATS,
        asset_folder,
        context,
        timestamp,
        transformation,
        upload_preset,
      },
      AppConfig.CLOUDINARY_API_SECRET,
    );

    // Returns the necessary parameters for the client-side upload.
    return {
      cloudName: AppConfig.CLOUDINARY_CLOUD_NAME,
      apiKey: AppConfig.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      asset_folder,
      allowed_formats: ALLOWED_FORMATS,
      max_file_size: MAX_FILE_SIZE_BYTES,
      transformation,
      upload_preset,
      context,
    };
  };

  static async fetchImageAsset(publicId: string) {
    return await cloudinary.api.resource(publicId, {
      resource_type: CloudinaryResourceType.IMAGE,
    });
  }

  static assertValidImageAsset = async (imagePublicId: string) => {
    const asset = await CloudinaryService.fetchImageAsset(imagePublicId);

    if (!asset) {
      throw new NotFoundException(`Image with ID ${imagePublicId} not found`);
    }

    if (asset.resource_type !== CloudinaryResourceType.IMAGE) {
      throw new BadRequestException(`Asset with ID ${imagePublicId} is not an image`);
    }
  };

  static deleteImageAsset = async (publicId: string) => {
    return await cloudinary.uploader.destroy(publicId);
  };

  static moveImageFromTempFolder = async (
    publicId: string,
    entityId: string,
    imageType: ImageType,
  ) => {
    return await cloudinary.uploader.explicit(publicId, {
      type: "upload",
      resource_type: CloudinaryResourceType.IMAGE,
      asset_folder: getFinalUploadFolder(imageType, entityId),
    });
  };

  static getAssetUrl = (publicId: string) => {
    return cloudinary.url(publicId);
  };
}
