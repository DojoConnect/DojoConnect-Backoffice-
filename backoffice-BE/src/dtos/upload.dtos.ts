import { z } from "zod";
import { GetCloudinarySignatureSchema } from "../validations/upload.schemas.js";

export type GetCloudinarySignatureDto = z.infer<
  typeof GetCloudinarySignatureSchema
>;
