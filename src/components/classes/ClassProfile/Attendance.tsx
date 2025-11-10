import { FaEllipsisV, FaRegCalendarAlt, FaRegChartBar, FaRegUser, FaSearch, FaFilter } from "react-icons/fa";

export default function AttendanceTab({
  attendance,
  rows,
}: {
  attendance: any;
  rows: any[];
}) {
  // Extract attendanceSummary from attendance prop
  const attendanceSummary = attendance?.summary || {
    totalSessions: 0,
    averageRate: "0%",
    lowAttendanceCount: 0,
    lowAttendancePercent: "0%",
  };

  // Extract attendanceRows from attendance prop or use rows
  const attendanceRows = attendance?.rows || rows;

  return (
    <div>
      {/* Attendance Summary & Cards in one container */}
      <div className="rounded-md border border-gray-200 bg-white px-6 py-4 mb-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-black font-semibold text-base">Attendance Summary</span>
        </div>
        <div className="flex gap-4">
          {/* Total Sessions Held */}
          <div className="flex-1 rounded-md border border-gray-100 bg-white px-6 py-4 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                <FaRegCalendarAlt className="text-red-400" />
              </span>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <FaEllipsisV />
              </button>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{attendanceSummary.totalSessions}</div>
            <div className="text-gray-500 text-sm">Total sessions held</div>
          </div>
          {/* Average Attendance Rate */}
          <div className="flex-1 rounded-md border border-gray-100 bg-white px-6 py-4 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                <FaRegChartBar className="text-red-400" />
              </span>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <FaEllipsisV />
              </button>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{attendanceSummary.averageRate}</div>
            <div className="text-gray-500 text-sm">Average attendance rate</div>
          </div>
          {/* Students with Low Attendance */}
          <div className="flex-1 rounded-md border border-gray-100 bg-white px-6 py-4 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                <FaRegUser className="text-red-400" />
              </span>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <FaEllipsisV />
              </button>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{attendanceSummary.lowAttendanceCount}</div>
            <div className="flex items-center justify-between text-gray-500 text-sm">
              <span>Students with low attendance</span>
              <span className="bg-red-100 text-red-500 rounded-md px-2 py-1 ml-2 text-xs font-semibold">
                {attendanceSummary.lowAttendancePercent} of total
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Attendance History Section */}
      <div className="rounded-md border border-gray-200 bg-white px-6 py-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-black font-semibold text-base">Attendance History</span>
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="pl-8 pr-3 py-2 rounded-md border border-gray-300 bg-white-50 text-sm w-[140px]"
              />
              <FaSearch className="absolute left-2 top-2.5 text-gray-400" />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Filter"
                className="pl-8 pr-3 py-2 rounded-md border border-gray-300 bg-white-50 text-sm w-[90px]"
              />
              <FaFilter className="absolute left-2 top-2.5 text-gray-400" />
            </div>
          </div>
        </div>
        {/* Attendance Table */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3"><input type="checkbox" /></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Attendance %</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Sessions Attended</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Sessions Missed</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Last Attended</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {attendanceRows.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3"><input type="checkbox" /></td>
                <td className="flex items-center gap-2 px-4 py-3">
                  <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full object-cover" />
                  {student.name}
                </td>
                <td className="px-4 py-3">{student.attendance}</td>
                <td className="px-4 py-3">{student.sessionsAttended}</td>
                <td className="px-4 py-3">{student.sessionsMissed}</td>
                <td className="px-4 py-3">{student.lastAttended}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-600">
                    {student.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="bg-white border border-gray-200 rounded p-1">
                    <FaEllipsisV className="text-gray-400 inline" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}