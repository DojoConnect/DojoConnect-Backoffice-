import React from "react";
import { FaChevronLeft, FaChevronRight, FaSearch, FaRegClock } from "react-icons/fa";
import { HiOutlineMenuAlt3 } from "react-icons/hi";

export const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DaySchedule {
  day: string;
  date: number | string;
  type: "class" | "empty";
  className?: string;
  time?: string;
}

interface ClassScheduleCalendarProps {
  schedule: DaySchedule[][];
}

const ClassScheduleCalendar: React.FC<ClassScheduleCalendarProps> = ({ schedule }) => {
  return (
    <div className="bg-white border border-gray-300 rounded-md p-4 w-full">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2 border-t border-gray-300 pt-2 pb-4 border-b">
        {/* Left: Today & Arrows */}
        <div className="flex items-center gap-2">
          <button className="bg-white border border-gray-300 rounded-md px-3 py-1 text-black text-sm font-medium">Today</button>
          <div className="flex gap-1">
            <button className="bg-white border border-gray-300 rounded-md p-1">
              <FaChevronLeft className="text-gray-600" />
            </button>
            <button className="bg-white border border-gray-300 rounded-md p-1">
              <FaChevronRight className="text-gray-600" />
            </button>
          </div>
        </div>
        {/* Center: Month/Year */}
        <div className="text-lg font-semibold text-gray-600">July, 2025</div>
        {/* Right: View Switch & Search */}
        <div className="flex items-center gap-2">
          <button className="bg-white border border-gray-300 rounded-md px-2 py-1 flex items-center gap-1">
            <span className="text-gray-600 font-semibold">Week</span>
            <span className="text-black font-semibold">/ Month</span>
          </button>
          <button className="bg-white border border-gray-300 rounded-md p-2">
            <HiOutlineMenuAlt3 className="text-gray-600" />
          </button>
          <button className="bg-white border border-gray-300 rounded-md p-2">
            <FaSearch className="text-gray-600" />
          </button>
        </div>
      </div>
      {/* Days Row */}
      <div className="flex border-b border-gray-300">
        {days.map((d, idx) => (
          <div
            key={d}
            className={`flex-1 text-center py-4 text-lg font-bold text-gray-500 border-b-2 border-gray-300 ${idx !== days.length - 1 ? "border-r border-gray-300" : ""}`}
          >
            {d}
          </div>
        ))}
      </div>
      {/* Calendar Weeks */}
      <div>
        {schedule.map((week, i) => (
          <div key={i} className="flex">
            {week.map((day, j) => {
              if (day.type === "empty") {
                return (
                  <div key={j} className="flex-1 flex flex-col items-center justify-start p-2 bg-gray-100 border border-gray-200 min-h-[180px]">
                    <span className="text-gray-400 font-bold text-lg mb-2">{day.date}</span>
                  </div>
                );
              }
              if (day.type === "class") {
                return (
                  <div key={j} className="flex-1 flex flex-col justify-between p-2 border border-gray-200 min-h-[180px]">
                    <span className="text-gray-700 font-bold text-lg mb-2">{day.date}</span>
                    <div className="w-full flex items-end h-full mt-auto">
                      <div className="w-1 h-12 bg-purple-700 rounded-l"></div>
                      <div className="flex-1 bg-purple-50 px-2 py-1 rounded-r flex flex-col justify-end">
                        <div className="text-purple-700 font-semibold text-sm">{day.className}</div>
                        <div className="flex items-center text-purple-700 text-xs mt-1">
                          <FaRegClock className="mr-1" /> {day.time}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassScheduleCalendar;