import React, { useState, useRef, useEffect } from 'react';
import { FaEllipsisV, FaPlus, FaTimes, FaChevronDown, FaEye, FaTrash } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import Pagination from '../Pagination';
import SearchActionBarCreateNew from './SearchActionBarCreateNew';

interface Child {
  id: string | number;
  name: string;
  email: string;
  enrolledDate: string;
  lastActivity: string;
  status: string;
  avatar: string;
}

interface ChildrenTableProps {
  childrenData: Child[];
}

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const years = Array.from({ length: 26 }, (_, i) => 2000 + i);
const experiences = ["Beginner", "Intermediate", "Advanced"];

export default function ChildrenTable({ childrenData }: ChildrenTableProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionChild, setActionChild] = useState<Child | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteChild, setDeleteChild] = useState<Child | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setActionChild(null);
      }
    }
    if (actionChild) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionChild]);

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    day: "",
    month: "",
    year: "",
    experience: "",
    sendConsent: false,
  });

  // Calculate age for parental consent
  const getAge = () => {
    if (!form.day || !form.month || !form.year) return null;
    const dob = new Date(`${form.month} ${form.day}, ${form.year}`);
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const age = getAge();

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Handle form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  // Empty state
  if (!childrenData || childrenData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border">
        {/* SVG */}
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" fill="none"><path fill="url(#a)" d="M75 150c41.421 0 75-33.579 75-75S116.421 0 75 0 0 33.579 0 75s33.579 75 75 75Z"/><path fill="#fff" d="M120 150H30V53a16.018 16.018 0 0 0 16-16h58a15.906 15.906 0 0 0 4.691 11.308A15.89 15.89 0 0 0 120 53v97Z"/><path fill="#E51B1B" d="M75 102c13.255 0 24-10.745 24-24S88.255 54 75 54 51 64.745 51 78s10.745 24 24 24Z"/><path fill="#fff" d="M83.485 89.314 75 80.829l-8.485 8.485-2.829-2.829L72.172 78l-8.486-8.485 2.829-2.829L75 75.172l8.485-8.486 2.829 2.829L77.828 78l8.486 8.485-2.829 2.829Z"/><path fill="#FCDEDE" d="M88 108H62a3 3 0 1 0 0 6h26a3 3 0 1 0 0-6ZM97 120H53a3 3 0 1 0 0 6h44a3 3 0 1 0 0-6Z"/><defs><linearGradient id="a" x1="75" x2="75" y1="0" y2="150" gradientUnits="userSpaceOnUse"><stop stopColor="#FCEDED"/><stop offset="1" stopColor="#FCDEDE"/></linearGradient></defs></svg>
        </div>
        <div className="mt-6 text-black font-semibold text-lg">No Child Enrolled</div>
        <div className="mt-2 text-gray-500 text-sm">No child has been added to this profile.</div>
        <button
          className="mt-6 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-semibold"
          onClick={() => setShowModal(true)}
        >
          <FaPlus className="text-lg" /> Enroll Child
        </button>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.03)" }}>
            <div className="bg-white rounded-md shadow-lg w-full max-w-2xl mx-4 relative">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-10 pt-10">
                {/* SVG */}
                <div>
                  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_d_11290_4962)">
                      <rect x="2" y="1" width="48" height="48" rx="10" fill="white"/>
                      <rect x="2.5" y="1.5" width="47" height="47" rx="9.5" stroke="#E9EAEB"/>
                      <path d="M25.9996 19.0004C25.9996 20.9886 24.3878 22.6004 22.3996 22.6004C20.4114 22.6004 18.7996 20.9886 18.7996 19.0004C18.7996 17.0122 20.4114 15.4004 22.3996 15.4004C24.3878 15.4004 25.9996 17.0122 25.9996 19.0004Z" fill="#414651"/>
                      <path d="M15.9379 32.714C15.4612 32.4087 15.185 31.8656 15.2549 31.3039C15.6966 27.7508 18.7269 25.0004 22.3995 25.0004C26.072 25.0004 29.1024 27.75 29.5441 31.303C29.614 31.8648 29.3378 32.4078 28.861 32.7131C26.9959 33.9074 24.7785 34.6004 22.3995 34.6004C20.0205 34.6004 17.8031 33.9081 15.9379 32.714Z" fill="#414651"/>
                      <path d="M33.4996 19.9004C33.4996 19.4033 33.0967 19.0004 32.5996 19.0004C32.1026 19.0004 31.6996 19.4033 31.6996 19.9004V22.3004H29.2996C28.8026 22.3004 28.3996 22.7033 28.3996 23.2004C28.3996 23.6974 28.8026 24.1004 29.2996 24.1004H31.6996V26.5004C31.6996 26.9974 32.1026 27.4004 32.5996 27.4004C33.0967 27.4004 33.4996 26.9974 33.4996 26.5004V24.1004H35.8996C36.3967 24.1004 36.7996 23.6974 36.7996 23.2004C36.7996 22.7033 36.3967 22.3004 35.8996 22.3004H33.4996V19.9004Z" fill="#414651"/>
                    </g>
                    <defs>
                      <filter id="filter0_d_11290_4962" x="0" y="0" width="52" height="52" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="1"/>
                        <feGaussianBlur stdDeviation="1"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0509804 0 0 0 0 0.0705882 0 0 0 0.05 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_11290_4962"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_11290_4962" result="shape"/>
                      </filter>
                    </defs>
                  </svg>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                  <FaTimes />
                </button>
              </div>
              {/* Modal Title */}
              <div className="px-10 pt-4 pb-2">
                <div className="text-black font-semibold text-lg">Create a new child's profile</div>
                <div className="text-gray-500 text-sm mt-1">Fill the form to add a new child</div>
              </div>
              {/* Form */}
              <form className="px-10 pb-10 pt-2 space-y-5" onSubmit={handleFormSubmit}>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleInput}
                    placeholder="Enter the user's first name"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleInput}
                    placeholder="Enter the user's last name"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInput}
                    placeholder="Enter the user's email"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <select
                        name="day"
                        value={form.day}
                        onChange={handleInput}
                        className="w-full border rounded-md px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-200"
                      >
                        <option value="">Day</option>
                        {days.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="flex-1 relative">
                      <select
                        name="month"
                        value={form.month}
                        onChange={handleInput}
                        className="w-full border rounded-md px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-200"
                      >
                        <option value="">Month</option>
                        {months.map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="flex-1 relative">
                      <select
                        name="year"
                        value={form.year}
                        onChange={handleInput}
                        className="w-full border rounded-md px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-200"
                      >
                        <option value="">Year</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Experience (optional)</label>
                  <div className="relative">
                    <select
                      name="experience"
                      value={form.experience}
                      onChange={handleInput}
                      className="w-full border rounded-md px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <option value="">Select experience</option>
                      {experiences.map(exp => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                {/* Parental Consent */}
                {age !== null && age < 16 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="sendConsent"
                      checked={form.sendConsent}
                      onChange={handleInput}
                      className="accent-red-600"
                    />
                    <span className="text-xs text-gray-700">Send parental consent</span>
                  </div>
                )}
                {/* Actions */}
                <div className="flex items-center justify-between pt-2 px-0 -mx-10 bg-gray-50 rounded-b-md" style={{marginTop: "2rem", padding: "1.5rem 2.5rem"}}>
                  <button
                    type="button"
                    className="text-black text-sm cursor-pointer"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-red-600 text-sm cursor-pointer"
                    >
                      Save as draft
                    </button>
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-md text-sm font-semibold cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)" }}>
            <div className="bg-white rounded-md shadow-lg w-full max-w-sm mx-4 relative px-8 py-8">
              <div className="flex justify-center mb-6">
                <img src="/Modalimg1.png" alt="img1" className="w-10 h-10 rounded-full -mr-2 border-2 border-white" />
                <img src="/Modalimg2.png" alt="img2" className="w-10 h-10 rounded-full -mr-2 border-2 border-white" />
                <img src="/Modalimg3.png" alt="img3" className="w-10 h-10 rounded-full border-2 border-white" />
              </div>
              <div className="text-black text-lg font-semibold text-center mb-2">New profile created</div>
              <div className="text-gray-500 text-sm text-center mb-6">You are about to create a new profile</div>
              <div className="flex justify-center gap-3">
                <button
                  className="border border-gray-300 bg-white text-black px-6 py-2 rounded-md font-semibold"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-600 border border-red-600 text-white px-6 py-2 rounded-md font-semibold"
                  onClick={() => {
                    setShowConfirm(false);
                    setShowModal(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Table view
  return (
    <>
      <SearchActionBarCreateNew />
      <div className="rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3">
                <input type="checkbox" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Enrolled Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Last Activity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {childrenData.map((child) => (
              <tr key={child.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3">
                  <input type="checkbox" />
                </td>
                <td className="flex items-center gap-2 px-4 py-3">
                  <img src={child.avatar} alt={child.name} className="w-8 h-8 rounded-full" />
                  {child.name}
                </td>
                <td className="px-4 py-3">{child.email}</td>
                <td className="px-4 py-3">{child.enrolledDate}</td>
                <td className="px-4 py-3">{child.lastActivity}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">
                    {child.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right relative" onClick={e => e.stopPropagation()}>
                  <FaEllipsisV
                    className="text-gray-400 inline cursor-pointer"
                    onClick={() => setActionChild(child)}
                  />
                  {actionChild && actionChild.id === child.id && (
                    <div
                      ref={actionMenuRef}
                      className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg border z-50"
                    >
                      <button
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-50 text-sm"
                        onClick={() => {
                          // TODO: handle view details
                          setActionChild(null);
                        }}
                      >
                        <FaEye className="text-gray-500 mr-2" /> View Details
                      </button>
                      <button
                        className="flex items-center w-full px-4 py-2 hover:bg-red-50 text-sm"
                        onClick={() => {
                          setDeleteChild(child);
                          setShowDeleteModal(true);
                          setActionChild(null);
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
        {/* Delete Confirmation Modal */}
        {showDeleteModal && deleteChild && (
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
                Delete Profile
              </div>
              {/* Row 3: centered gray text */}
              <div className="mb-6 text-center text-gray-500 text-sm">
                Are you sure you want to remove <span className="text-black">{deleteChild.name.split(" ")[0]}</span>'s profile? This action cannot be undone.
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
                    // TODO: call API to delete child
                    setShowDeleteModal(false);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4">
        <Pagination
          totalRows={childrenData.length}
          currentPage={1}
          onPageChange={() => {}}
        />
      </div>
    </>
  );
}