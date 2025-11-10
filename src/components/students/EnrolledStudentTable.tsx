import { students } from "./studentData";
import { FaEllipsisV } from "react-icons/fa";

export default function EnrolledStudentsTable() {
  return (
    <div className="bg-gray-100 rounded-md p-4">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-200 rounded-md">
            <th className="p-3">
              <input type="checkbox" />
            </th>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Enrolled Date</th>
            <th className="p-3 text-left">Last Activity</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="bg-white rounded-md">
              <td className="p-3">
                <input type="checkbox" />
              </td>
              <td className="p-3 flex items-center gap-2">
                <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full object-cover" />
                <span>{student.name}</span>
              </td>
              <td className="p-3">{student.email}</td>
              <td className="p-3">{student.enrolledDate}</td>
              <td className="p-3">{student.lastActivity}</td>
              <td className="p-3">
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">
                  {student.status}
                </span>
              </td>
              <td className="p-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 bg-gray-50">
                  <FaEllipsisV className="text-gray-400" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}