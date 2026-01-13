import { z } from "zod";
import { ExperienceLevel } from "../constants/enums.js";
import { DateOnlySchema } from "./helpers.schemas.js";

export const AddChildSchema = z.object({
  firstName: z.string().trim().nonempty("First name is required"),
  lastName: z.string().trim().nonempty("Last name is required"),
  email: z.email("Invalid email address").trim(),
  dob: DateOnlySchema,
  experience: z.enum(ExperienceLevel),
});

export type AddChildDTO = z.infer<typeof AddChildSchema>;
