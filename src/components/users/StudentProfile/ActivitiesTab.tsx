import { useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
import SearchActionBar from "./SearchActionBar";
import Pagination from "./Pagination";

interface Activity {
  type: string;
  description: string;
  date: string;
}

interface ActivitiesTabProps {
  activities?: Activity[];
}

export default function ActivitiesTab({ activities = [] }: ActivitiesTabProps) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 3;
  const totalPages = Math.ceil(activities.length / rowsPerPage);
  const pagedActivities = activities.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <SearchActionBar />
      {/* Border line just before the table, no space */}
      <div className="border-b border-gray-200" />
      <div className="overflow-x-auto">
        {activities.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No activities found.</div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-white">
                <th className="p-3 text-left text-black font-medium text-xs sm:text-sm">Activity Type</th>
                <th className="p-3 text-left text-black font-medium text-xs sm:text-sm">Description</th>
                <th className="p-3 text-left text-black font-medium text-xs sm:text-sm">Date &amp; Time Added</th>
                <th className="p-3 text-left text-black font-medium text-xs sm:text-sm"></th>
              </tr>
              {/* Light gray border line below table head */}
              <tr>
                <td colSpan={4} className="border-b border-gray-200 p-0"></td>
              </tr>
            </thead>
            <tbody>
              {pagedActivities.map((act, idx) => (
                <tr key={idx} className="bg-white border-b border-gray-200 last:border-b-0 h-14">
                  <td className="p-3 text-xs sm:text-sm">{act.type}</td>
                  <td className="p-3 text-xs sm:text-sm">{act.description}</td>
                  <td className="p-3 text-xs sm:text-sm">{act.date}</td>
                  <td className="p-3">
                    <FaEllipsisV className="border border-gray-200 rounded-md p-1 w-6 h-6 text-gray-400 bg-white cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination with all-round border */}
      {activities.length > 0 && (
        <div className="rounded-md p-2 mt-4">
          <Pagination
            totalRows={activities.length}
            rowsPerPage={rowsPerPage}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}