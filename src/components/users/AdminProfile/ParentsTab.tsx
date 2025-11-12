import React from "react";
import Pagination from "../StudentProfile/Pagination";
import { FaPlus, FaEllipsisV } from "react-icons/fa";

const statusStyles = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-red-100 text-red-600",
  Disabled: "bg-yellow-100 text-yellow-600",
};

export default function ParentsTab({ parents = [] }: { parents?: any[] }) {
  if (!parents.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <img src="/illustration.png" alt="No info" className="w-40 h-40 mb-4" />
        <div className="mt-6 text-black text-lg font-semibold">No info yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="overflow-x-auto">
        <table className="w-full bg-white">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-3 text-left text-black font-medium">
                <input type="checkbox" />
              </th>
              <th className="p-3 text-left text-black font-medium">Name</th>
              <th className="p-3 text-left text-black font-medium">Email</th>
              <th className="p-3 text-left text-black font-medium">Joined Date</th>
              <th className="p-3 text-left text-black font-medium">Last Activity</th>
              <th className="p-3 text-left text-black font-medium">Status</th>
              <th className="p-3 text-left text-black font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {parents.map((parent, idx) => (
              <tr key={idx} className="bg-white border-b border-gray-200 last:border-b-0 h-14">
                <td className="p-3">
                  <input type="checkbox" />
                </td>
                <td className="p-3 flex items-center gap-2">
                  <img src={parent.img} alt={parent.name} className="w-8 h-8 rounded-full" />
                  <span>{parent.name}</span>
                </td>
                <td className="p-3">{parent.email}</td>
                <td className="p-3">{parent.joined}</td>
                <td className="p-3">{parent.lastActivity}</td>
                <td className="p-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[parent.status as keyof typeof statusStyles]}`}>
                    {parent.status}
                  </span>
                </td>
                <td className="p-3">
                  <FaEllipsisV className="border border-gray-200 rounded-md p-1 w-6 h-6 text-gray-400 bg-white cursor-pointer" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border border-gray-200 rounded-md p-2 mt-4">
        <Pagination
                   totalRows={parents.length}
                   currentPage={1}
                   onPageChange={() => {}}
                 />
      </div>
    </div>
  );
}