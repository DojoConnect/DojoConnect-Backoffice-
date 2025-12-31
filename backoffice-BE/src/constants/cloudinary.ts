// Defines the types of images that can be uploaded.
export enum ImageType {
  CLASS = "class",
  PROFILE = "profile",
}

// Allowed image formats for uploads.
export const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];

// Maximum file size for uploads (5MB).
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Transformation applied to uploaded images to optimize them.
export const IMAGE_TRANSFORMATIONS = {
  [ImageType.CLASS]: "w_1200,h_675,c_fill,q_auto:good,f_auto,fl_strip_profile",
  [ImageType.PROFILE]:
    "w_256,h_256,c_thumb,g_face,q_auto:good,f_auto,fl_strip_profile",
} as const;

export const UPLOAD_PRESETS = {
  general_signed_image_upload: "general_signed_image_upload",
} as const;
