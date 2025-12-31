import { v2 as cloudinary } from "cloudinary";
import AppConfig from "../config/AppConfig.js";
import {
  ALLOWED_FORMATS,
  IMAGE_TRANSFORMATIONS,
  ImageType,
  MAX_FILE_SIZE_BYTES,
  UPLOAD_PRESETS,
} from "../constants/cloudinary.js";
import { GetCloudinarySignatureDto } from "../dtos/upload.dtos.js";
import { InternalServerErrorException } from "../core/errors/InternalServerErrorException.js";

// Maps image types to their corresponding Cloudinary folder paths.
const FOLDER_MAP: Record<ImageType, string> = {
  [ImageType.CLASS]: "dojos/{dojoId}/class",
  [ImageType.PROFILE]: "dojos/{dojoId}/profile",
};

// Determines the Cloudinary folder for an upload based on image type and dojo ID.
const getUploadFolder = (dojoId: string) => {
  return `dojos/${dojoId}`;
};

export class CloudinaryService {
  // Generates a signed upload signature for Cloudinary.
  static getCloudinarySignature = (
    dto: GetCloudinarySignatureDto,
  ) => {
    const { imageType, dojoId } = dto;
    if (!IMAGE_TRANSFORMATIONS[imageType]) {
      throw new InternalServerErrorException(`Unsupported image type: ${imageType}`);
    }

    const asset_folder = getUploadFolder(dojoId);
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Defines the transformation to be applied to the uploaded image.
    const transformation = IMAGE_TRANSFORMATIONS[imageType];

    const upload_preset = UPLOAD_PRESETS.general_signed_image_upload;

    const context = `dojoId=${dojoId}|imageType=${imageType}`;


    // Creates a signature for the upload request.
    const signature = cloudinary.utils.api_sign_request(
      {
        allowed_formats: ALLOWED_FORMATS,
        context,
        asset_folder,
        timestamp,
        transformation,
        upload_preset,
      },
      AppConfig.CLOUDINARY_API_SECRET
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
      context
    };
  };
}