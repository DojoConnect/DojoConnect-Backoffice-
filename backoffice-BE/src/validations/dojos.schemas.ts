import { z } from "zod";

export const UpdateDojoSchema = z.object({
  name: z.string().trim().nonempty(),
  tagline: z.string().trim().nonempty(),
});

export type UpdateDojoDTO = z.infer<typeof UpdateDojoSchema>;
