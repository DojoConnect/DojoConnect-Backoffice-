import React, { useState } from "react";
import { FaFlag, FaChevronDown } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const years = Array.from({ length: 20 }, (_, i) => 2010 + i);
const experiences = ["Beginner", "Amateur", "Advanced"];

export default function SearchActionsBar() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-3">
          {/* Search */}
          <div className="flex items-center border border-gray-200 rounded-md px-3 py-2 bg-white">
            <span className="text-gray-400 mr-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search"
              className="outline-none bg-transparent text-sm"
            />
          </div>
          {/* Filter */}
          <div className="flex items-center border border-gray-200 rounded-md px-3 py-2 bg-white">
            <span className="text-gray-400 mr-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-.293.707l-6.414 6.414A1 1 0 0 0 14 14.414V19a1 1 0 0 1-1.447.894l-4-2A1 1 0 0 1 8 17V14.414a1 1 0 0 0-.293-.707L1.293 6.707A1 1 0 0 1 1 6V4z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Filter"
              className="outline-none bg-transparent text-sm"
            />
          </div>
        </div>
        {/* Right Buttons */}
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 bg-red-600 text-white rounded-md px-4 py-2 font-medium shadow hover:bg-red-700 transition"
            onClick={() => setShowModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create New
          </button>
          <button className="flex items-center gap-2 bg-white border border-red-600 rounded-md px-4 py-2 font-medium text-red-600 shadow hover:bg-red-50 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4m-8 8h12"/>
            </svg>
            Export
          </button>
        </div>
      </div>
      {/* Modal */}
      {showModal && (
        <CreateChildProfileModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function CreateChildProfileModal({ onClose }: { onClose: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [day, setDay] = useState<number | "">("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<number | "">("");
  const [experience, setExperience] = useState<string>("");

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={onClose}
      />
      {/* Modal Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Header row */}
          <div className="flex items-center mb-6">
            <div className="bg-gray-100 rounded-full p-2 mr-3">
              <FaFlag className="text-gray-400" size={20} />
            </div>
            <div className="flex-1 border-r border-gray-200 h-8" />
            <button
              className="ml-3 text-gray-400 text-2xl cursor-pointer"
              onClick={onClose}
              aria-label="Close"
            >
              <IoMdClose />
            </button>
          </div>
          {/* Title & Subtext */}
          <div className="mb-1 text-black font-bold text-lg">Create new child's profile</div>
          <div className="mb-6 text-gray-500 text-sm">Fill the form to add a new child</div>
          {/* Form */}
          <form>
            {/* First Name */}
            <label className="block text-gray-600 text-sm mb-1">First Name</label>
            <input
              className="w-full mb-4 px-3 py-2 rounded bg-gray-50 text-gray-700 border border-gray-200 placeholder-gray-400"
              placeholder="Enter the user's first name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
            {/* Last Name */}
            <label className="block text-gray-600 text-sm mb-1">Last Name</label>
            <input
              className="w-full mb-4 px-3 py-2 rounded bg-gray-50 text-gray-700 border border-gray-200 placeholder-gray-400"
              placeholder="Enter the user's last name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
            {/* Email Address */}
            <label className="block text-gray-600 text-sm mb-1">Email Address</label>
            <input
              className="w-full mb-4 px-3 py-2 rounded bg-gray-50 text-gray-700 border border-gray-200 placeholder-gray-400"
              placeholder="Enter the user's email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
            />
            {/* Date of Birth */}
            <label className="block text-gray-600 text-sm mb-1">Date of Birth</label>
            <div className="flex gap-2 mb-4">
              {/* Day */}
              <div className="relative flex-1">
                <select
                  className="w-full px-3 py-2 rounded bg-gray-50 text-gray-700 border border-gray-200 appearance-none"
                  value={day}
                  onChange={e => setDay(Number(e.target.value))}
                >
                  <option value="">Day</option>
                  {days.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
              {/* Month */}
              <div className="relative flex-1">
                <select
                  className="w-full px-3 py-2 rounded bg-gray-50 text-gray-700 border border-gray-200 appearance-none"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                >
                  <option value="">Month</option>
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
              {/* Year */}
              <div className="relative flex-1">
                <select
                  className="w-full px-3 py-2 rounded bg-gray-50 text-gray-700 border border-gray-200 appearance-none"
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                >
                  <option value="">Year</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {/* Experience */}
            <label className="block text-gray-600 text-sm mb-1">Experience (optional)</label>
            <div className="relative mb-6">
              <select
                className="w-full px-3 py-2 rounded bg-gray-50 text-gray-700 border border-gray-200 appearance-none"
                value={experience}
                onChange={e => setExperience(e.target.value)}
              >
                <option value="">Select experience</option>
                {experiences.map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
              <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-md bg-red-600 text-white py-2 font-semibold"
            >
              Create Profile
            </button>
          </form>
        </div>
      </div>
    </>
  );
}