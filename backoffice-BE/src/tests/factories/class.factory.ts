import {
  ClassFrequency,
  ClassLevel,
  ClassSubscriptionType,
  ClassStatus,
  Weekday,
} from "../../constants/enums.js";
import { IClass, IClassSchedule } from "../../repositories/class.repository.js";
import { CreateClassDTO } from "../../validations/classes.schemas.js";
import { DeepPartial } from "../../utils/types.utils.js";

export const buildClassScheduleMock = (
  overrides?: Partial<IClassSchedule>
): IClassSchedule => {
  return {
    id: "schedule-1",
    classId: "class-1",
    weekday: Weekday.Monday,
    startTime: "10:00:00",
    endTime: "11:00:00",
    initialClassDate: new Date(),
    ...overrides,
  };
};

export const buildClassMock = (
  overrides?: DeepPartial<IClass & { schedules: IClassSchedule[] }>
): IClass & { schedules: IClassSchedule[] } => {
  const schedules: IClassSchedule[] = overrides?.schedules?.map((s, index) =>
    buildClassScheduleMock({
      ...s,
      id: s?.id ?? `schedule-${index + 1}`,
      classId: s?.classId ?? "class-1",
    })
  ) ?? [buildClassScheduleMock()];

  const { schedules: _, ...classOverrides } = overrides ?? {};

  return {
    id: "class-1",
    dojoId: "dojo-1",
    instructorId: "instructor-1",
    name: "Karate 101",
    description: "Beginner's karate class.",
    level: ClassLevel.Beginner,
    minAge: 6,
    maxAge: 10,
    capacity: 20,
    streetAddress: "123 Main St",
    city: "Anytown",
    gradingDate: null,
    frequency: ClassFrequency.Weekly,
    subscriptionType: ClassSubscriptionType.Paid,
    price: "50.00",
    imagePublicId: null,
    status: ClassStatus.Active,
    createdAt: new Date(),
    updatedAt: new Date(),
    schedules,
    ...classOverrides,
  };
};

type WeeklyDTO = Extract<CreateClassDTO, { frequency: ClassFrequency.Weekly }>;

type OneTimeDTO = Extract<
  CreateClassDTO,
  { frequency: ClassFrequency.OneTime }
>;

type WeeklyOverrides = Partial<WeeklyDTO>;
type OneTimeOverrides = Partial<OneTimeDTO>;

export function buildCreateClassDTOMock(overrides?: WeeklyOverrides): WeeklyDTO;

export function buildCreateClassDTOMock(
  overrides: OneTimeOverrides & { frequency: ClassFrequency.OneTime }
): OneTimeDTO;
export function buildCreateClassDTOMock(
  overrides?: WeeklyOverrides | OneTimeOverrides
): CreateClassDTO {
  if (overrides?.frequency === ClassFrequency.OneTime) {
    const { frequency: _, ...safeOverrides } = overrides;

    const oneTimeData: OneTimeDTO = {
      frequency: ClassFrequency.OneTime,
      name: "Mock One-Time Class",
      level: ClassLevel.Beginner,
      minAge: 10,
      maxAge: 99,
      capacity: 50,
      streetAddress: "456 Event Rd",
      gradingDate: null,
      city: "Specialtown",
      subscriptionType: ClassSubscriptionType.Paid,
      price: 30,
      schedules: [
        {
          type: ClassFrequency.OneTime,
          date: new Date(),
          startTime: "09:00",
          endTime: "12:00",
        },
      ],
      ...safeOverrides,
    };

    return oneTimeData;
  }

  const { frequency: _, ...safeOverrides } = overrides ?? {};

  const weeklyData: WeeklyDTO = {
    frequency: ClassFrequency.Weekly,
    name: "Mock Weekly Class",
    level: ClassLevel.Beginner,
    minAge: 5,
    maxAge: 10,
    capacity: 15,
    streetAddress: "123 Mock St",
    gradingDate: null,
    city: "Mockville",
    subscriptionType: ClassSubscriptionType.Free,
    schedules: [
      {
        type: ClassFrequency.Weekly,
        weekday: Weekday.Monday,
        startTime: "16:00",
        endTime: "17:00",
      } as any,
    ],
    ...safeOverrides,
  };

  return weeklyData;
}
