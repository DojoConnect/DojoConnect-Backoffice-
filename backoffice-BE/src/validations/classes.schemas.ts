import { z } from "zod";
import { parseISO, isValid } from "date-fns";
import {
  ClassFrequency,
  ClassLevel,
  ClassSubscriptionType,
  Weekday,
} from "../constants/enums.js";

// -------------------
// TIME SCHEMA
// -------------------
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const TimeSchema = z.iso.time({
  precision: -1, // HH:MM (minute precision)
});

export type TimeHHmm = z.infer<typeof TimeSchema>;

export const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// -------------------
// DATE-ONLY SCHEMA
// -------------------
export const DateOnlySchema = z.iso.date().transform((v) => {
  const date = parseISO(v);
  if (!isValid(date)) throw new Error("Invalid calendar date");
  return date;
});

// -------------------
// BASE START/END TIME SCHEMA
// -------------------
const BaseStartEndTimeSchema = z.object({
  startTime: TimeSchema,
  endTime: TimeSchema,
});

const WeeklyScheduleSchema = BaseStartEndTimeSchema.extend({
  type: z.literal(ClassFrequency.Weekly),
  weekday: z.enum(Weekday),
}).refine((s) => timeToMinutes(s.startTime) < timeToMinutes(s.endTime), {
  message: "End time must be after start time",
  path: ["startTime"],
});

const OneTimeScheduleSchema = BaseStartEndTimeSchema.extend({
  type: z.literal(ClassFrequency.OneTime),
  date: DateOnlySchema,
}).refine((s) => timeToMinutes(s.startTime) < timeToMinutes(s.endTime), {
  message: "End time must be after start time",
  path: ["startTime"],
});

// -------------------
// SHARED CLASS FIELDS
// -------------------
// Extract common fields to avoid repetition
const BaseClassSchema = z.object({
  name: z.string().trim().min(1),
  level: z.enum(ClassLevel),
  minAge: z.number().int().positive(),
  maxAge: z.number().int().positive(),
  description: z.string().trim().max(150).optional(),
  capacity: z.number().int().positive(),
  streetAddress: z.string().trim().min(1),
  city: z.string().trim().min(1),
  gradingDate: z.iso
    .date()
    .optional().nullable()
    .transform((v) => (typeof v === "string" ? new Date(v) : v)),
  subscriptionType: z.enum(ClassSubscriptionType),
  price: z.number().min(0).optional(),
  instructorId: z.uuid().optional(),
  imagePublicId: z.string().optional(),
});

// -------------------
// ROOT DISCRIMINATED UNION
// -------------------

const WeeklyClassSchema = BaseClassSchema.extend({
  frequency: z.literal(ClassFrequency.Weekly),
  // Strict array of weekly schedules
  schedules: z.array(WeeklyScheduleSchema).min(1),
});

const OneTimeClassSchema = BaseClassSchema.extend({
  frequency: z.literal(ClassFrequency.OneTime),
  // Tuple of exactly one item, strictly one_time type
  schedules: z.tuple([OneTimeScheduleSchema]),
});

// Combine them
export const CreateClassSchema = z
  .discriminatedUnion("frequency", [WeeklyClassSchema, OneTimeClassSchema])
  .refine((data) => data.minAge <= data.maxAge, {
    message: "Minimum age cannot be greater than maximum age.",
    path: ["minAge"],
  })
  .superRefine((data, ctx) => {
    // Keep your price/subscription logic here,
    // but the frequency/schedule logic is now handled by the structure above!
    if (
      data.subscriptionType === ClassSubscriptionType.Free &&
      data.price &&
      data.price !== 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Free classes must have price 0.",
        path: ["price"],
      });
    }
    if (
      data.subscriptionType === ClassSubscriptionType.Paid &&
      (!data.price || data.price <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Paid classes must have a price > 0.",
        path: ["price"],
      });
    }
  });
export type CreateClassDTO = z.infer<typeof CreateClassSchema>;
