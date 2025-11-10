import React, { useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
import SearchActionBar from "./SearchActionBar";
import Pagination from "./Pagination";

export default function AssignedClassesTable({ assignedClasses }: { assignedClasses: any[] }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const pagedClasses = assignedClasses.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="mt-6">
      <SearchActionBar />
      {assignedClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96">
          <img
            src="/illustration.png"
            alt="No classes"
            className="w-56 h-56 mb-6 object-contain"
          />
          <div className="text-black font-semibold text-lg mb-2 text-center">
            No classes in this profile yet ...
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-md border border-gray-200 p-4">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 rounded-md">
                  <th className="p-3 rounded-l-md text-left">Class Name</th>
                  <th className="p-3 text-left">Class Level</th>
                  <th className="p-3 text-left">Enrolled Students</th>
                  <th className="p-3 text-left">Date Assigned</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 rounded-r-md text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedClasses.map((cls, idx) => (
                  <tr key={cls.class_uid || cls.id || idx} className="border-b">
                    <td className="p-3 flex items-center gap-2">
                      <img src={`/${cls.image_path || "classImage.png"}`} alt={cls.class_name} className="w-10 h-10 rounded-md" />
                      <span>{cls.class_name}</span>
                    </td>
                    <td className="p-3">{cls.level}</td>
                    <td className="p-3">{cls.capacity}</td>
                    <td className="p-3">{cls.created_at?.split(" ")[0]}</td>
                    <td className="p-3">
                      <span className="rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-700">
                        {cls.status}
                      </span>
                    </td>
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
            totalRows={assignedClasses.length}
            rowsPerPage={rowsPerPage}
            currentPage={page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}