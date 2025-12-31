import { Day } from "date-fns";
import { Weekday } from "../constants/enums.js";

export const formatDateForMySQL = (date: Date) => {
  return date.toISOString().slice(0, 19).replace("T", " ");
};

export const mapWeekdayToDayNumber = (weekday: Weekday): Day => {
  switch (weekday) {
    case Weekday.Sunday:
      return 0;
    case Weekday.Monday:
      return 1;
    case Weekday.Tuesday:
      return 2;
    case Weekday.Wednesday:
      return 3;
    case Weekday.Thursday:
      return 4;
    case Weekday.Friday:
      return 5;
    case Weekday.Saturday:
      return 6;
    default:
      throw new Error("Invalid weekday");
  }
};
