import React from "react";
import { FaEllipsisV } from "react-icons/fa";
import SearchActionBar from "../StudentProfile/SearchActionBar";
import Pagination from "../StudentProfile/Pagination";

interface Activity {
  id: string | number;
  type: string;
  description: string;
  date: string;
  time: string;
}

export default function ActivitiesTab({ activities = [] }: { activities?: Activity[] }) {
  if (!activities.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <img src="/illustration.png" alt="No info" className="w-40 h-40 mb-4" />
        <div className="text-black font-semibold text-lg">No info yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white-100 rounded-md p-4">
      <SearchActionBar />
      <table className="w-full">
        <thead>
          <tr className="bg-gray-200 rounded-md">
            <th className="p-3 rounded-l-md text-left">Activity Type</th>
            <th className="p-3 text-left">Description</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Time Added</th>
            <th className="p-3 rounded-r-md text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((act) => (
            <tr key={act.id} className="border-b">
              <td className="p-3">{act.type}</td>
              <td className="p-3">{act.description}</td>
              <td className="p-3">{act.date}</td>
              <td className="p-3">{act.time}</td>
              <td className="p-3 text-center">
                <div className="flex justify-center items-center gap-2">
                  <FaEllipsisV className="border border-gray-300 rounded-md p-2 bg-white text-gray-400" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="rounded-md p-2 mt-4">
       <Pagination
      totalRows={activities.length}
      currentPage={1}
      onPageChange={() => {}}
      />
      </div>
    </div>
  );
}