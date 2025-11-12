import React, { useState, useRef, useEffect } from 'react';
import { FaEllipsisV, FaEye, FaTrash, FaTimes } from "react-icons/fa";

// Define the User type or import it from the appropriate file
interface User {
  id: string | number;
  name: string;
  email: string;
  userType: string;
  joinedDate: string;
  lastActivity: string;
  status: string;
  avatar: string;
}

const statusStyleMap: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-red-100 text-red-600",
  disabled: "bg-gray-200 text-gray-600",
  draft: "bg-gray-100 text-gray-500",
};

interface UsersTableProps {
  user: User[];
  onUserClick?: (user: User) => void;
  showUserType?: boolean;
}

export default function UsersTable({ user, onUserClick, showUserType = true }: UsersTableProps) {
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close action menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setActionUser(null);
      }
    }
    if (actionUser) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionUser]);

  return (
    <>
      {/* Responsive Table Wrapper */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3">
                <input type="checkbox" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Email</th>
              {showUserType && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">User Type</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Joined Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Last Activity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {user.map((u) => (
              <tr key={u.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => { onUserClick && onUserClick(u) }}
              >
                <td className="px-4 py-3">
                  <input type="checkbox" />
                </td>
                <td className="flex items-center gap-2 px-4 py-3">
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full" />
                  {u.name}
                </td>
                <td className="px-4 py-3">{u.email}</td>
                {showUserType && (
                  <td className="px-4 py-3">{u.userType}</td>
                )}
                <td className="px-4 py-3">{u.joinedDate}</td>
                <td className="px-4 py-3">{u.lastActivity}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusStyleMap[(u.status || "active").toLowerCase()] || "bg-gray-100 text-gray-500"}`}>
                    {(u.status || "Active").charAt(0).toUpperCase() + (u.status || "Active").slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right relative" onClick={e => e.stopPropagation()}>
                  <FaEllipsisV
                    className="text-gray-400 inline cursor-pointer"
                    onClick={() => setActionUser(u)}
                  />
                  {actionUser && actionUser.id === u.id && (
                    <div
                      ref={actionMenuRef}
                      className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg border z-50"
                    >
                      <button
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-50 text-sm"
                        onClick={() => {
                          onUserClick && onUserClick(u);
                          setActionUser(null);
                        }}
                      >
                        <FaEye className="text-gray-500 mr-2" /> View Details
                      </button>
                      <button
                        className="flex items-center w-full px-4 py-2 hover:bg-red-50 text-sm"
                        onClick={() => {
                          setDeleteUser(u);
                          setShowDeleteModal(true);
                          setActionUser(null);
                        }}
                      >
                        <FaTrash className="text-red-500 mr-2" />
                        <span className="text-red-600">Remove profile</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)" }}>
          <div className="bg-white rounded-md p-6 w-full max-w-xs shadow-lg relative">
            {/* Row 1: trash icon and close */}
            <div className="flex items-center justify-between mb-4">
              <span className="bg-red-100 text-red-600 rounded-full p-2">
                <FaTrash className="w-5 h-5" />
              </span>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowDeleteModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            {/* Row 2: centered bold text */}
            <div className="mb-2 text-start font-semibold text-lg text-black">
              Delete Profile
            </div>
            {/* Row 3: centered gray text */}
            <div className="mb-6 text-start text-gray-500 text-sm">
              Are you sure you want to remove <span className="text-black">{deleteUser.name.split(" ")[0]}</span>'s profile? This action cannot be undone.
            </div>
            {/* Buttons: full width, little space between */}
            <div className="flex gap-2">
              <button
                className="bg-gray-100 text-gray-700 rounded-md px-4 py-2 font-medium w-full"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white rounded-md px-4 py-2 font-medium w-full"
                onClick={() => {
                  // TODO: call API to delete user
                  setShowDeleteModal(false);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}