import React, { useState } from "react";
import { FaPlus, FaEllipsisV } from "react-icons/fa";
import Pagination from "../Pagination";
import SearchFilterExport from "../../classes/SearchFilterExport";
import CreateClassModal from "../../classes/CreateClassModal";

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-red-100 text-red-600",
  disabled: "bg-yellow-100 text-yellow-600",
  "payment overdue": "bg-red-600 text-white",
  "class completed": "bg-yellow-400 text-white",
};

interface ClassesTabProps {
  classes: any[];
  dojoName?: string;
  ownerEmail?: string;
}

export default function ClassesTab({ classes, dojoName = "Test Dojo", ownerEmail = "admin@example.com" }: ClassesTabProps) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const pagedClasses = classes.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // View state: "list" or "create"
  const [activeView, setActiveView] = useState<"list" | "create">("list");

  React.useEffect(() => {
    setPage(1);
  }, [classes]);

  // Handler for Create New button
  const handleCreateNew = () => setActiveView("create");
  const handleCloseCreate = () => setActiveView("list");

  // Render CreateClassModal as a section, not a modal
  if (activeView === "create") {
    return (
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <CreateClassModal
          open={true}
          onClose={handleCloseCreate}
          dojoName={dojoName}
          ownerEmail={ownerEmail}
          onCreated={handleCloseCreate}
        />
      </div>
    );
  }

  // Main classes list view
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      {/* Search & Filter above the table */}
      <div className="mb-6">
        <SearchFilterExport
          dojoName={dojoName}
          ownerEmail={ownerEmail}
          showCreate={false} // Hide modal logic inside SearchFilterExport
          onCreateNew={handleCreateNew} // Custom handler for Create New
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white">
          <thead>
            <tr className="bg-gray-100 rounded-md">
              <th className="p-3 rounded-l-md text-left">
                <input type="checkbox" />
              </th>
              <th className="p-3 text-left text-black font-medium">Class Name</th>
              <th className="p-3 text-left text-black font-medium">Class Level</th>
              <th className="p-3 text-left text-black font-medium">Enrolled Students</th>
              <th className="p-3 text-left text-black font-medium">Date Assigned</th>
              <th className="p-3 text-left text-black font-medium">Status</th>
              <th className="p-3 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {pagedClasses.map((cls: any) => (
              <tr key={cls.class_uid} className="bg-white border-b border-gray-200 last:border-b-0 h-14">
                <td className="p-3">
                  <input type="checkbox" />
                </td>
                <td className="p-3 flex items-center gap-2">
                  <img src={`/${cls.image_path || "classImage.png"}`} alt={cls.class_name} className="w-10 h-10 rounded-full" />
                  <span>{cls.class_name}</span>
                </td>
                <td className="p-3">{cls.level}</td>
                <td className="p-3">{cls.capacity}</td>
                <td className="p-3">{cls.created_at?.split(" ")[0]}</td>
                <td className="p-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[(cls.status || "").toLowerCase()] || "bg-gray-100 text-gray-500"}`}>
                    {cls.status}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <FaEllipsisV className="border border-gray-300 rounded-md p-1 bg-white" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border rounded-md p-2 mt-4">
        <Pagination
          totalRows={classes.length}
          rowsPerPage={rowsPerPage}
          currentPage={page}
          onPageChange={setPage}
        />
      </div>
      {/* Empty state */}
      {!classes.length && (
        <div className="flex flex-col items-center justify-center h-96">
          <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" fill="none"><path fill="url(#a)" d="M75 150c41.421 0 75-33.579 75-75S116.421 0 75 0 0 33.579 0 75s33.579 75 75 75Z"/><path fill="#fff" d="M120 150H30V53a16.018 16.018 0 0 0 16-16h58a15.906 15.906 0 0 0 4.691 11.308A15.89 15.89 0 0 0 120 53v97Z"/><path fill="#E51B1B" d="M75 102c13.255 0 24-10.745 24-24S88.255 54 75 54 51 64.745 51 78s10.745 24 24 24Z"/><path fill="#fff" d="M83.485 89.314 75 80.829l-8.485 8.485-2.829-2.829L72.172 78l-8.486-8.485 2.829-2.829L75 75.172l8.485-8.486 2.829 2.829L77.828 78l8.486 8.485-2.829 2.829Z"/><path fill="#FCDEDE" d="M88 108H62a3 3 0 1 0 0 6h26a3 3 0 1 0 0-6ZM97 120H53a3 3 0 1 0 0 6h44a3 3 0 1 0 0-6Z"/><defs><linearGradient id="a" x1="75" x2="75" y1="0" y2="150" gradientUnits="userSpaceOnUse"><stop stopColor="#FCEDED"/><stop offset="1" stopColor="#FCDEDE"/></linearGradient></defs></svg>
          <div className="text-black text-lg font-semibold mb-2">No classes in this profile</div>
          <div className="text-gray-500 text-sm mb-6">There are no classes assigned to this user yet.</div>
          <button
            className="mt-6 flex items-center bg-[#E51B1B] text-white px-6 py-2 rounded-md font-semibold cursor-pointer"
            onClick={handleCreateNew}
          >
            <FaPlus className="mr-2" /> Create Class
          </button>
        </div>
      )}
    </div>
  );
}