import z from "zod";

export const InviteInstructorSchema = z.object({
  email: z.string().trim().email().nonempty(),
  firstName: z.string().trim().nonempty(),
  lastName: z.string().trim().nonempty(),
  classId: z.string().trim().nonempty().uuid().optional().nullable(),
});

export const DeclineInviteSchema = z.object({
  token: z.string().trim().nonempty(),
});

export type InviteInstructorDTO = z.infer<typeof InviteInstructorSchema>;
export type DeclineInviteDTO = z.infer<typeof DeclineInviteSchema>;
