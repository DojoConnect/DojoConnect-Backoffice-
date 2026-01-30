import { z } from "zod";
import { DateOnlySchema } from "./helpers.schemas.js";

export const UpdateProfileSchema = z.object({
  firstName: z.string().trim().nonempty().optional(),
  lastName: z.string().trim().nonempty().optional(),
  username: z.string().trim().nonempty().optional(),
  gender: z.string().trim().nonempty().optional(),
  dob: DateOnlySchema.optional(),
  street: z.string().trim().nonempty().optional(),
  city: z.string().trim().nonempty().optional(),
});

export const UpdateProfileImageSchema = z.object({
  publicId: z.string().trim().nonempty(),
});


export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;
export type UpdateProfileImageDTO = z.infer<typeof UpdateProfileImageSchema>;