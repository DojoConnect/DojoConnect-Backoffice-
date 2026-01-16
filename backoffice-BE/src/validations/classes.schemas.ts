import { z } from "zod";
import {
  ClassFrequency,
  ExperienceLevel,
  ClassSubscriptionType,
  GradingNotificationUnit,
  Weekday,
} from "../constants/enums.js";
import { DateOnlySchema, isoDateSchema } from "./helpers.schemas.js";

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
// BASE START/END TIME SCHEMA
// -------------------
const BaseStartEndTimeSchema = z.object({
  startTime: TimeSchema,
  endTime: TimeSchema,
});

export const WeeklyScheduleSchema = BaseStartEndTimeSchema.extend({
  type: z.literal(ClassFrequency.Weekly),
  weekday: z.enum(Weekday),
}).refine((s) => timeToMinutes(s.startTime) < timeToMinutes(s.endTime), {
  message: "End time must be after start time",
  path: ["startTime"],
});
export type WeeklySchedule = z.infer<typeof WeeklyScheduleSchema>;

export const OneTimeScheduleSchema = BaseStartEndTimeSchema.extend({
  type: z.literal(ClassFrequency.OneTime),
  date: DateOnlySchema,
}).refine((s) => timeToMinutes(s.startTime) < timeToMinutes(s.endTime), {
  message: "End time must be after start time",
  path: ["startTime"],
});
export type OneTimeSchedule = z.infer<typeof OneTimeScheduleSchema>;

// -------------------
// SHARED CLASS FIELDS
// -------------------
// Extract common fields to avoid repetition
const BaseClassSchema = z.object({
  name: z.string().trim().min(1),
  level: z.enum(ExperienceLevel),
  minAge: z.number().int().positive(),
  maxAge: z.number().int().positive(),
  description: z.string().trim().max(150).optional(),
  capacity: z.number().int().positive(),
  streetAddress: z.string().trim().min(1),
  city: z.string().trim().min(1),
  gradingDate: isoDateSchema.optional().nullable(),
  gradingNotification: z
    .object({
      unit: z.enum(GradingNotificationUnit),
      value: z.number().nonnegative(),
    })
    .optional()
    .nullable(),
  subscriptionType: z.enum(ClassSubscriptionType),
  price: z.number().min(0).optional(),
  instructorId: z.uuid().optional().nullable(),
  imagePublicId: z.string().nonempty().optional().nullable(),
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
  .discriminatedUnion("frequency", [WeeklyClassSchema, OneTimeClassSchema], {error: `Invalid class frequency. Expected : ${ClassFrequency.Weekly} | ${ClassFrequency.OneTime}`})
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

export const UpdateClassSchema = BaseClassSchema.omit({
  subscriptionType: true,
  price: true,
})
  .extend({
    subscriptionType: z.undefined({
      message: "Subscription type cannot be updated.",
    }),
    price: z.undefined({ message: "Price cannot be updated." }),
  })
  .partial()
  .extend({
    schedules: z
      .union([
        z.array(WeeklyScheduleSchema).min(1),
        z.tuple([OneTimeScheduleSchema]),
      ])
      .optional(),
  })
  .refine(
    (data) => {
      if (data.minAge !== undefined && data.maxAge !== undefined) {
        return data.minAge <= data.maxAge;
      }
      return true;
    },
    {
      message: "Minimum age cannot be greater than maximum age.",
      path: ["minAge"],
    }
  );

export type UpdateClassDTO = z.infer<typeof UpdateClassSchema>;

export const UpdateClassInstructorSchema = z.object({
  instructorId: z.uuid().nullable(),
});

export type CreateClassScheduleDTO = z.infer<typeof CreateClassSchema>["schedules"];


export const EnrollStudentSchema = z.object({
  studentIds: z.array(z.uuid()).min(1),
});
