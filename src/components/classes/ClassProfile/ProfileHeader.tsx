import React from "react";
import { FaArrowLeft } from 'react-icons/fa';

export default function ProfileHeader({ 
  profile,
  onBack,
}: { 
  profile: any;
   onBack: () => void;
   }) {
  return (
     <>
      {/* Go Back Button and Breadcrumb */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-100 transition"
          aria-label="Go Back"
          type="button"
        >
          <FaArrowLeft className="text-black" />
        </button>
        <span className="text-gray-500 text-sm mr-2">Go Back</span>
        <span className="text-gray-400 mx-2">|</span>
        <span className="text-gray-500 text-sm">Classes</span>
        <span className="text-gray-400 mx-2">/</span>
        <span className="text-gray-500 text-sm">Class List</span>
        <span className="text-gray-400 mx-2">/</span>
        <span className="text-red-600 text-sm font-semibold">Class Profile</span>
      </div>
      {/* Profile Info */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <img
            src={profile.classImg}
            alt={profile.ClassName}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <div className="text-2xl font-bold">{profile.className}</div>
            <div className="text-gray-500 text-sm mt-2">{profile.classLevel}</div>
          </div>
        </div>
        <button className="bg-green-600 text-white rounded-full px-6 py-2 text-sm font-semibold">
          {profile.status}
        </button>
      </div>
    </>
  );
}