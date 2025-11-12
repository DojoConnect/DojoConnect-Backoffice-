import { days } from "./Calendar";

export interface DaySchedule {
  day: string;
  date: number | string;
  type: "class" | "empty";
  className?: string;
  time?: string;
}

export function transformScheduleToCalendar(class_schedule: any[]): DaySchedule[][] {
  // For simplicity, show one week (Mon-Sun)
  const week: DaySchedule[] = days.map(dayName => {
    const found = class_schedule.find(s => s.day === dayName);
    if (found) {
      return {
        day: found.day,
        date: found.day, // You can use a real date if available
        type: "class",
        className: "Class", // Or found.class_name if available
        time: `${found.start_time} - ${found.end_time}`,
      };
    }
    return {
      day: dayName,
      date: dayName,
      type: "empty",
    };
  });
  return [week];
}