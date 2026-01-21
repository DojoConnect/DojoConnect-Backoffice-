import { ClassFrequency, ExperienceLevel, ClassSubscriptionType } from "../constants/enums.js";
import { classes, classSchedules } from "../db/schema.js";
import { InferSelectModel } from "drizzle-orm";
import { CloudinaryService } from "../services/cloudinary.service.js";
import { UpdateClassInstructorSchema } from "../validations/classes.schemas.js";
import z from "zod";
import { SchedulesAndInstructor } from "../repositories/class.repository.js";
import { InstructorUserDetails } from "../repositories/user.repository.js";

export type Class = InferSelectModel<typeof classes>;
export type ClassSchedule = InferSelectModel<typeof classSchedules>;
export type NewClassSchedule = InferSelectModel<typeof classSchedules>;

export type UpdateClassInstructorDto = z.infer<typeof UpdateClassInstructorSchema>;

export class ClassDTO {
  id: string;
  dojoId: string;
  name: string;
  level: ExperienceLevel;
  minAge: number;
  maxAge: number;
  description: string | null;
  capacity: number;
  streetAddress: string;
  city: string;
  gradingDate: Date | null;
  frequency: ClassFrequency;
  subscriptionType: ClassSubscriptionType;
  price: string | null;
  instructorId: string | null;
  imagePublicId: string | null;
  schedules: ClassScheduleDTO[];
  instructor: InstructorUserDetails | null;

  constructor(data: Class & Partial<SchedulesAndInstructor>) {
    this.id = data.id;
    this.dojoId = data.dojoId;
    this.name = data.name;
    this.level = data.level as ExperienceLevel;
    this.minAge = data.minAge;
    this.maxAge = data.maxAge;
    this.description = data.description;
    this.capacity = data.capacity;
    this.streetAddress = data.streetAddress;
    this.city = data.city;
    this.gradingDate = data.gradingDate;
    this.frequency = data.frequency as ClassFrequency;
    this.subscriptionType = data.subscriptionType as ClassSubscriptionType;
    this.price = data.price;
    this.instructorId = data.instructorId;
    this.imagePublicId = data.imagePublicId;
    this.schedules = (data.schedules ?? []).map((schedule) => new ClassScheduleDTO(schedule));
    this.instructor = data.instructor ?? null;
  }

  toJSON() {
    return {
      id: this.id,
      dojoId: this.dojoId,
      name: this.name,
      level: this.level,
      minAge: this.minAge,
      maxAge: this.maxAge,
      description: this.description,
      capacity: this.capacity,
      streetAddress: this.streetAddress,
      city: this.city,
      gradingDate: this.gradingDate,
      frequency: this.frequency,
      subscriptionType: this.subscriptionType,
      price: this.price,
      instructor: this.instructor
        ? {
            id: this.instructor.instructorId,
            lastName: this.instructor.lastName,
            firstName: this.instructor.firstName,
            email: this.instructor.email,
            avatarUrl: this.instructor.avatar
              ? CloudinaryService.getAssetUrl(this.instructor.avatar)
              : null,
          }
        : null,
      imageUrl: this.imagePublicId ? CloudinaryService.getAssetUrl(this.imagePublicId) : null,
      schedules: this.schedules.map((schedule) => schedule.toJSON()),
    };
  }
}

export class ClassScheduleDTO {
  id: string;
  weekday: string | null;
  startTime: string | null;
  endTime: string | null;
  initialClassDate: Date | null;

  constructor(data: ClassSchedule) {
    this.id = data.id;
    this.weekday = data.weekday;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.initialClassDate = data.initialClassDate;
  }

  toJSON() {
    return {
      id: this.id,
      weekday: this.weekday,
      startTime: this.startTime,
      endTime: this.endTime,
      initialClassDate: this.initialClassDate,
    };
  }
}
