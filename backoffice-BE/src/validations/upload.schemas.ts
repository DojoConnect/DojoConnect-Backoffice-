import { z } from "zod";
import { ImageType } from "../constants/cloudinary.js";

export const GetCloudinarySignatureSchema = z.object({
  imageType: z.enum(ImageType),
  dojoId: z.uuid(),
});
