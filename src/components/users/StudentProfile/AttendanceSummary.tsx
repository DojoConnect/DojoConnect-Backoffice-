import { useState } from "react";
import { FaUser, FaChevronDown, FaExclamationCircle } from "react-icons/fa";
import { FaRegSquare } from "react-icons/fa6";
import { FaEllipsisV } from "react-icons/fa";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface AttendanceStat {
  icon: JSX.Element;
  days: number;
  label: string;
  iconRight?: JSX.Element;
  color?: string;
  bg?: string;
  percent?: string;
}

interface ClassSummary {
  id: number | string;
  classImg?: string;
  className: string;
  totalSessions: string;
  avgAttendance: string;
  enrollmentDate: string;
  status: string;
}

interface AttendanceSummaryProps {
  summary?: {
    present?: number;
    absent?: number;
    lateness?: number;
    lateness_percent?: string;
    [key: string]: any;
  };
  classes?: ClassSummary[];
}

export default function AttendanceSummaryTab({
  summary = {},
  classes = [],
}: AttendanceSummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState("June");
  const [showDropdown, setShowDropdown] = useState(false);

  // Build stats from backend summary or fallback to 0
  const attendanceStats: AttendanceStat[] = [
    {
      icon: <FaUser className="text-green-600 bg-green-100 rounded-full p-2 w-8 h-8" />,
      days: summary.present ?? 0,
      label: "Present",
      iconRight: <FaExclamationCircle className="text-gray-200 bg-white-200 w-5 h-5" />,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      icon: <FaUser className="text-red-500 bg-red-100 rounded-full p-2 w-8 h-8" />,
      days: summary.absent ?? 0,
      label: "Absent",
      iconRight: <FaExclamationCircle className="text-gray-200 bg-white-200 w-5 h-5" />,
      color: "text-red-500",
      bg: "bg-red-100",
    },
    {
      icon: <FaRegSquare className="text-yellow-500 bg-yellow-100 rounded p-2 w-8 h-8" />,
      days: summary.lateness ?? 0,
      label: "Lateness",
      color: "text-yellow-500",
      bg: "bg-yellow-100",
      percent: summary.lateness_percent ?? "0%",
    },
  ];

  return (
    <div className="bg-white rounded-md border border-gray-200 p-4">
      {/* Attendance Summary Header + Cards in a bordered div */}
      <div className="border border-gray-200 rounded-md mb-6 p-4">
        <div className="flex items-center justify-between mb-6">
          <span className="text-black font-semibold text-base">Attendance Summary</span>
          <div className="relative">
            <button
              className="flex items-center gap-2 border border-gray-200 bg-white rounded-full px-4 py-2 text-gray-500 font-medium shadow-sm cursor-pointer"
              onClick={() => setShowDropdown((v) => !v)}
              type="button"
            >
              {selectedMonth}
              <FaChevronDown className="w-4 h-4" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {months.map((month) => (
                  <div
                    key={month}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSelectedMonth(month);
                      setShowDropdown(false);
                    }}
                  >
                    {month}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Attendance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {attendanceStats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-md p-4 flex flex-col justify-between relative h-full">
              <div className="flex items-center justify-between">
                <span>{stat.icon}</span>
                <span>{stat.iconRight}</span>
              </div>
              <div className="mt-4 text-black font-bold text-xl">{stat.days} {stat.label === "Lateness" ? "day" : "days"}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-gray-500 text-sm">{stat.label}</div>
                {/* Show percent badge only for Lateness, at the bottom right */}
                {stat.label === "Lateness" && (
                  <span className="rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-600 ml-2">
                    {stat.percent} of total
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Classes Table */}
      <div className="overflow-x-auto">
        {classes.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No class attendance records found.</div>
        ) : (
          <table className="w-full bg-white">
            <thead>
              <tr className="bg-white border-b border-gray-300">
                <th className="p-3 text-left text-black-200">
                  <input type="checkbox" />
                </th>
                <th className="p-3 text-left text-black-200">Class Name</th>
                <th className="p-3 text-left text-black-200">Total Sessions</th>
                <th className="p-3 text-left text-black-200">Avg Attendance</th>
                <th className="p-3 text-left text-black-200">Enrollment Date</th>
                <th className="p-3 text-left text-black-200">Status</th>
                <th className="p-3 text-left text-black-200"></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} className="border-b border-gray-300 last:border-b-0 hover:bg-gray-50 cursor-pointer">
                  <td className="p-3">
                    <input type="checkbox" />
                  </td>
                  <td className="p-3 flex items-center gap-2">
                    <img src={cls.classImg || "/classImage.png"} alt={cls.className} className="w-8 h-8 rounded-full" />
                    <span>{cls.className}</span>
                  </td>
                  <td className="p-3">{cls.totalSessions}</td>
                  <td className="p-3">{cls.avgAttendance}</td>
                  <td className="p-3">{cls.enrollmentDate}</td>
                  <td className="p-3">
                    <span className="rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-600">
                      {cls.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <FaEllipsisV className="bg-white border border-gray-300 rounded-md p-1 w-6 h-6 text-gray-400 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}