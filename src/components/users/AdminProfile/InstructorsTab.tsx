import React, { useState } from "react";
import Pagination from "../StudentProfile/Pagination";
import { FaPlus, FaEllipsisV } from "react-icons/fa";
import ProfileFormModal from "../ProfileFormModal";
import ConfirmProfileModal from "../ConfirmProfileModal";

const statusStyles = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-red-100 text-red-600",
  Disabled: "bg-yellow-100 text-yellow-600",
};

export default function InstructorsTab({ instructors = [], refreshInstructors }: { instructors?: any[], refreshInstructors?: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Modal flow: open form, then confirm, then create
  const handleCreateClick = () => setShowForm(true);
  const handleFormConfirm = (payload: any) => {
    setPendingPayload(payload);
    setShowForm(false);
    setShowConfirm(true);
  };
  const handleConfirm = async () => {
    if (!pendingPayload) return;
    setLoading(true);
    try {
      await fetch("https://backoffice-api.dojoconnect.app/create_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingPayload),
      });
      setShowConfirm(false);
      setPendingPayload(null);
      setLoading(false);
      if (refreshInstructors) refreshInstructors();
    } catch {
      setShowConfirm(false);
      setPendingPayload(null);
      setLoading(false);
    }
  };

  if (!instructors.length) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-96">
          <img src="/illustration.png" alt="No info" className="w-40 h-40 mb-4" />
          <div className="mt-6 text-black text-lg font-semibold">No info yet</div>
          <button
            className="mt-6 flex items-center bg-[#E51B1B] text-white px-6 py-2 rounded-md font-semibold cursor-pointer"
            onClick={handleCreateClick}
          >
            <FaPlus className="mr-2" /> Add Instructor
          </button>
        </div>
        {showForm && (
          <ProfileFormModal
            type="instructor"
            onClose={() => setShowForm(false)}
            onConfirm={handleFormConfirm}
          />
        )}
        {showConfirm && (
          <ConfirmProfileModal
            onCancel={() => setShowConfirm(false)}
            onConfirm={handleConfirm}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="overflow-x-auto">
          <table className="w-full bg-white">
            <thead>
              <tr className="bg-gray-200 border-b border-gray-200">
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
              {instructors.map((inst, idx) => (
                <tr key={idx} className="bg-white border-b border-gray-200 last:border-b-0 h-14">
                  <td className="p-3">
                    <input type="checkbox" />
                  </td>
                  <td className="p-3 flex items-center gap-2">
                    <img src={inst.img} alt={inst.name} className="w-8 h-8 rounded-full" />
                    <span>{inst.name}</span>
                  </td>
                  <td className="p-3">{inst.email}</td>
                  <td className="p-3">{inst.joined}</td>
                  <td className="p-3">{inst.lastActivity}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[inst.status as keyof typeof statusStyles]}`}>
                      {inst.status}
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
        <div className="p-2 mt-4">
          <Pagination
            totalRows={instructors.length}
            currentPage={1}
            onPageChange={() => {}}
          />
        </div>
      </div>
      {showForm && (
        <ProfileFormModal
          type="instructor"
          onClose={() => setShowForm(false)}
          onConfirm={handleFormConfirm}
        />
      )}
      {showConfirm && (
        <ConfirmProfileModal
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}