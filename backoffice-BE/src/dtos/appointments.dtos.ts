import z from "zod";
import { CreateAppointmentSchema } from "../validations/appointments.schemas.js";

export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;
