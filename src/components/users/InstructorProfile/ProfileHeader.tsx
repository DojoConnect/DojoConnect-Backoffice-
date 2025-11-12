import React from "react";
import { FaArrowLeft } from 'react-icons/fa';

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-red-100 text-red-600",
  disabled: "bg-yellow-100 text-yellow-600",
  "payment overdue": "bg-red-600 text-white",
  "class completed": "bg-yellow-400 text-white",
};

export default function ProfileHeader({ 
  profile,
  onBack,
}: { 
  profile: any;
  onBack: () => void;
}) {
  return (
    <>
      <div className="flex flex-nowrap items-center gap-2 sm:gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-100 transition"
          aria-label="Go Back"
          type="button"
        >
          <FaArrowLeft className="text-black text-base sm:text-lg" />
        </button>
        <span className="text-gray-500 text-[11px] sm:text-sm mr-1 sm:mr-2">Go Back</span>
        <span className="text-gray-400 mx-1 sm:mx-2 text-[11px] sm:text-sm">|</span>
        <span className="text-gray-500 text-[11px] sm:text-sm">Users</span>
        <span className="text-gray-400 mx-1 sm:mx-2 text-[11px] sm:text-sm">/</span>
        <span className="text-gray-500 text-[11px] sm:text-sm">User List</span>
        <span className="text-gray-400 mx-1 sm:mx-2 text-[11px] sm:text-sm">/</span>
        <span className="text-red-600 text-[11px] sm:text-sm font-semibold whitespace-nowrap">User Profile</span>
      </div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 sm:gap-6">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-10 h-10 sm:w-20 sm:h-20 rounded-full object-cover"
          />
          <div>
            <div className="font-bold text-[15px] sm:text-2xl">{profile.name}</div>
            <div className="text-gray-500 text-[11px] sm:text-sm mt-1 sm:mt-2">{profile.email}</div>
          </div>
        </div>
        <button
          className={`rounded-full px-3 py-1 sm:px-6 sm:py-2 text-[11px] sm:text-sm font-semibold capitalize ${statusStyles[(profile.status || "active").toLowerCase()] || "bg-gray-100 text-gray-500"}`}
        >
          {(profile.status || "Active").charAt(0).toUpperCase() + (profile.status || "Active").slice(1)}
        </button>
      </div>
    </>
  );
}