import { z } from "zod";
import { AppointmentStatus, AppointmentType } from "../constants/enums.js";

export const CreateAppointmentSchema = z.object({
  dojo_id: z.string().trim().nonempty(),

  parent_name: z.string().trim().min(1, "parent_name is required"),
  email_address: z.string().trim().email("Invalid email_address"),
  contact_details: z.string().min(1, "contact_details is required"),

  reason_for_consultation: z.string().trim().optional().nullable(),
  preferred_contact_method: z.string().trim().optional().nullable(),
  preferred_time_range: z.string().trim().optional().nullable(),

  number_of_children: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const num = Number(val);
      return Number.isFinite(num) ? num : null;
    }),

  additional_notes: z.string().trim().optional().nullable(),

  consent_acknowledged: z.union([z.boolean(), z.string(), z.number()]).transform((v) => {
    // The controller converts to: consent = !!value ? 1 : 0
    if (v === "1" || v === 1 || v === true) return 1;
    return 0;
  }),

  appointment_type: z.nativeEnum(AppointmentType).optional().default(AppointmentType.Online),

  status: z.nativeEnum(AppointmentStatus).optional().default(AppointmentStatus.Pending),
});
