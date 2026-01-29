import { z } from "zod";
import { DateOnlySchema } from "./helpers.schemas.js";

export const UpdateProfileSchema = z.object({
  firstName: z.string().trim().nonempty(),
  lastName: z.string().trim().nonempty(),
  username: z.string().trim().nonempty(),
  gender: z.string().trim().nonempty(),
  dob: DateOnlySchema,
  street: z.string().trim().nonempty(),
  city: z.string().trim().nonempty(),
});

export const UpdateProfileImageSchema = z.object({
  publicId: z.string().trim().nonempty(),
});


export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;
export type UpdateProfileImageDTO = z.infer<typeof UpdateProfileImageSchema>;