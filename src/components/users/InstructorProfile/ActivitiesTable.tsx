import React, { useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
import SearchActionBar from "./SearchActionBar";
import Pagination from "./Pagination";

export default function ActivitiesTable({ activitiesList }: { activitiesList: any[] }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  // Pagination logic
  const pagedActivities = activitiesList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="mt-6">
      <SearchActionBar />
      {activitiesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96">
          <img
            src="/illustration.png"
            alt="No activities"
            className="w-56 h-56 mb-6 object-contain"
          />
          <div className="text-black font-semibold text-lg mb-2 text-center">
            No activities in this profile yet ...
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white-100 rounded-md p-4">
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
                {pagedActivities.map((act, idx) => (
                  <tr key={act.id || idx} className="border-b">
                    <td className="p-3">{act.type || act.title || "-"}</td>
                    <td className="p-3">{act.description || "-"}</td>
                    <td className="p-3">{act.date || "-"}</td>
                    <td className="p-3">{act.time || "-"}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <FaEllipsisV className="border border-gray-300 rounded-md p-1 bg-white text-gray-400" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            totalRows={activitiesList.length}
            rowsPerPage={rowsPerPage}
            currentPage={page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}