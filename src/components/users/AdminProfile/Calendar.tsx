import React from "react";
import { FaChevronLeft, FaChevronRight, FaSearch, FaRegClock } from "react-icons/fa";
import { HiOutlineMenuAlt3 } from "react-icons/hi";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const staticCalendar = [
  [
    { day: "MON", date: 29, type: "event", event: "School Event", time: "11-12pm" },
    { day: "TUE", date: 30, type: "class", className: "Karate Class", time: "10-11am" },
    { day: "WED", date: 31, type: "empty" },
    { day: "THU", date: 1, type: "class", className: "Judo Class", time: "9-10am" },
    { day: "FRI", date: 2, type: "class", className: "Aikido", time: "2-3pm" },
    { day: "SAT", date: 3, type: "event", event: "Open Day", time: "12-2pm" },
    { day: "SUN", date: 4, type: "empty" },
  ],
  [
    { day: "MON", date: 5, type: "event", event: "School Event", time: "11-12pm" },
    { day: "TUE", date: 6, type: "class", className: "Karate Class", time: "10-11am" },
    { day: "WED", date: 7, type: "empty" },
    { day: "THU", date: 8, type: "class", className: "Judo Class", time: "9-10am" },
    { day: "FRI", date: 9, type: "class", className: "Aikido", time: "2-3pm" },
    { day: "SAT", date: 10, type: "event", event: "Open Day", time: "12-2pm" },
    { day: "SUN", date: 11, type: "empty" },
  ],
  [
    { day: "MON", date: 12, type: "event", event: "School Event", time: "11-12pm" },
    { day: "TUE", date: 13, type: "empty" },
    { day: "WED", date: 14, type: "class", className: "Karate Class", time: "10-11am" },
    { day: "THU", date: 15, type: "class", className: "Judo Class", time: "9-10am" },
    { day: "FRI", date: 16, type: "class", className: "Aikido", time: "2-3pm" },
    { day: "SAT", date: 17, type: "event", event: "Open Day", time: "12-2pm" },
    { day: "SUN", date: 18, type: "empty" },
  ],
  [
    { day: "MON", date: 19, type: "class", className: "Karate Class", time: "10-11am" },
    { day: "TUE", date: 20, type: "class", className: "Judo Class", time: "9-10am" },
    { day: "WED", date: 21, type: "empty" },
    { day: "THU", date: 22, type: "event", event: "Parent Meeting", time: "1-2pm" },
    { day: "FRI", date: 23, type: "class", className: "Aikido", time: "2-3pm" },
    { day: "SAT", date: 24, type: "class", className: "Karate Class", time: "10-11am" },
    { day: "SUN", date: 25, type: "empty" },
  ],
];

const Calendar = () => {
  return (
    <div className="bg-white border border-gray-300 rounded-md p-4 w-full">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2 border-t border-gray-300 pt-2 pb-4 border-b border-gray-300">
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
        {staticCalendar.map((week, i) => (
          <div key={i} className="flex">
            {week.map((day, j) => {
              if (day.type === "empty") {
                return (
                  <div key={j} className="flex-1 flex flex-col items-center justify-start p-2 bg-gray-100 border border-gray-200 min-h-[180px]">
                    <span className="text-gray-400 font-bold text-lg mb-2">{day.date}</span>
                  </div>
                );
              }
              if (day.type === "event") {
                return (
                  <div key={j} className="flex-1 flex flex-col justify-between p-2 border border-gray-200 min-h-[180px]">
                    <span className="text-gray-700 font-bold text-lg mb-2">{day.date}</span>
                    <div className="w-full flex items-end h-full mt-auto">
                      <div className="w-1 h-12 bg-green-700 rounded-l"></div>
                      <div className="flex-1 bg-green-50 px-2 py-1 rounded-r flex flex-col justify-end">
                        <div className="text-green-700 font-semibold text-sm">{day.event}</div>
                        <div className="flex items-center text-green-700 text-xs mt-1">
                          <FaRegClock className="mr-1" /> {day.time}
                        </div>
                      </div>
                    </div>
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

export default Calendar;