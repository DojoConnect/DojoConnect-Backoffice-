import React, { useState, useRef, useEffect } from 'react';
import { FaEllipsisV, FaEye, FaTrash, FaTimes } from "react-icons/fa";
import SearchActionBar from './SearchActionBar';
import Pagination from '../Pagination';

interface ClassRow {
  id: string | number;
  className: string;
  classImg: string;
  classLevel: string;
  instructor: { name: string; avatar: string };
  enrollmentDate: string;
  status: string;
}

type EnrolledClassesProps = {
  classesData: any[];
};

const EnrolledClasses = ({ classesData }: EnrolledClassesProps) => {

  const [actionClass, setActionClass] = useState<ClassRow | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteClass, setDeleteClass] = useState<ClassRow | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close action menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setActionClass(null);
      }
    }
    if (actionClass) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionClass]);

    // Empty state
  if (!classesData || classesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border">
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" fill="none"><path fill="url(#a)" d="M75 150c41.421 0 75-33.579 75-75S116.421 0 75 0 0 33.579 0 75s33.579 75 75 75Z"/><path fill="#fff" d="M120 150H30V53a16.018 16.018 0 0 0 16-16h58a15.906 15.906 0 0 0 4.691 11.308A15.89 15.89 0 0 0 120 53v97Z"/><path fill="#E51B1B" d="M75 102c13.255 0 24-10.745 24-24S88.255 54 75 54 51 64.745 51 78s10.745 24 24 24Z"/><path fill="#fff" d="M83.485 89.314 75 80.829l-8.485 8.485-2.829-2.829L72.172 78l-8.486-8.485 2.829-2.829L75 75.172l8.485-8.486 2.829 2.829L77.828 78l8.486 8.485-2.829 2.829Z"/><path fill="#FCDEDE" d="M88 108H62a3 3 0 1 0 0 6h26a3 3 0 1 0 0-6ZM97 120H53a3 3 0 1 0 0 6h44a3 3 0 1 0 0-6Z"/><defs><linearGradient id="a" x1="75" x2="75" y1="0" y2="150" gradientUnits="userSpaceOnUse"><stop stopColor="#FCEDED"/><stop offset="1" stopColor="#FCDEDE"/></linearGradient></defs></svg>
        <div className="mt-6 text-black font-semibold text-lg">No Class Enrolled</div>
        <div className="mt-2 text-gray-500 text-sm">No class has been added to this profile.</div>
      </div>
    );
  }

  return (
    <>
    <SearchActionBar />
      <div className="rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3">
                <input type="checkbox" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Class Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Class Level</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Instructor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Enrollment Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {classesData.map((row) => (
              <tr key={row.id || idx} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3">
                  <input type="checkbox" />
                </td>
                <td className="flex items-center gap-2 px-4 py-3">
                  <img src={row.classImg} alt={row.className} className="w-8 h-8 rounded-md object-cover" />
                  <span>{row.className}</span>
                </td>
                <td className="px-4 py-3">{row.classLevel}</td>
                <td className="flex items-center gap-2 px-4 py-3">
                  <img src={row.instructor.avatar} alt={row.instructor.name} className="w-7 h-7 rounded-full object-cover" />
                  <span>{row.instructor.name}</span>
                </td>
                <td className="px-4 py-3">{row.enrollmentDate}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right relative" onClick={e => e.stopPropagation()}>
                  <FaEllipsisV
                    className="text-gray-400 inline cursor-pointer"
                    onClick={() => setActionClass(row)}
                  />
                  {actionClass && actionClass.id === row.id && (
                    <div
                      ref={actionMenuRef}
                      className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg border z-50"
                    >
                      <button
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-50 text-sm"
                        onClick={() => {
                          // TODO: handle view details
                          setActionClass(null);
                        }}
                      >
                        <FaEye className="text-gray-500 mr-2" /> View Details
                      </button>
                      <button
                        className="flex items-center w-full px-4 py-2 hover:bg-red-50 text-sm"
                        onClick={() => {
                          setDeleteClass(row);
                          setShowDeleteModal(true);
                          setActionClass(null);
                        }}
                      >
                        <FaTrash className="text-red-500 mr-2" />
                        <span className="text-red-600">Remove class</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       <div className="mt-4">
        <Pagination
          totalRows={classesData.length}
          currentPage={1}
          onPageChange={() => {}}
        />
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}>
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
            <div className="mb-2 text-center font-semibold text-lg text-black">
              Delete Class
            </div>
            {/* Row 3: centered gray text */}
            <div className="mb-6 text-center text-gray-500 text-sm">
              Are you sure you want to remove <span className="text-black">{deleteClass.className}</span>? This action cannot be undone.
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
                  // TODO: call API to delete class
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

export default EnrolledClasses;