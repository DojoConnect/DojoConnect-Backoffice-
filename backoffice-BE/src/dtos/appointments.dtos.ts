import z from "zod";
import { CreateAppointmentSchema } from "../validations/appointments.schemas";

export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;