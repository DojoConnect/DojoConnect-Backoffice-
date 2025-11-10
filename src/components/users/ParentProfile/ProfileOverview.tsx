import React, { useState } from "react";
import { FaUser, FaRegCopy, FaEnvelope, FaCalendarAlt } from "react-icons/fa";

interface ParentProfile {
  name?: string;
  email?: string;
  role?: string;
  linkedDojo?: string | null;
  joined?: string | null;
  city?: string | null;
  street?: string | null;
  subscription_status?: string | null;
  referral_code?: string;
  created_at?: string;
  nextOfKinName?: string | null;
  nextOfKinEmail?: string;
  relationship?: string | null;
  childrenCount?: string | number;
  classGroups?: string | null;
  subscriptionStatus?: string | null;
}

interface ProfileOverviewProps {
  profile: ParentProfile;
}

export default function ProfileOverview({ profile }: ProfileOverviewProps) {
  const [showActions, setShowActions] = useState(false);
  const [modal, setModal] = useState<null | "deactivate" | "export" | "delete" | "status">(null);
  const [editMode, setEditMode] = useState(false);

  // Editable fields state for edit section
  const [editFields, setEditFields] = useState({
    name: profile.name || "",
    email: profile.email || "",
    role: profile.role || "",
    city: profile.city || "",
    street: profile.street || "",
  });

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };

  // Helper: fallback for missing fields
  const fallback = (val: any, alt: string = "-") => val || alt;

  // Edit Profile Form
  if (editMode) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between bg-gray-100 rounded-md px-4 py-2 mb-4 w-full">
          <span className="text-gray-700 font-semibold">Edit Profile</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Editable fields */}
          <div className="space-y-4">
            <label className="block text-gray-700 text-sm mb-1">Full Name</label>
            <input className="w-full border border-gray-300 rounded-md px-3 py-2" name="name" value={editFields.name} onChange={handleEditChange} />
            <label className="block text-gray-700 text-sm mb-1">Contact Email</label>
            <input className="w-full border border-gray-300 rounded-md px-3 py-2" name="email" value={editFields.email} onChange={handleEditChange} />
            <label className="block text-gray-700 text-sm mb-1">Role</label>
            <input className="w-full border border-gray-300 rounded-md px-3 py-2" name="role" value={editFields.role} onChange={handleEditChange} />
            <label className="block text-gray-700 text-sm mb-1">City</label>
            <input className="w-full border border-gray-300 rounded-md px-3 py-2" name="city" value={editFields.city} onChange={handleEditChange} />
            <label className="block text-gray-700 text-sm mb-1">Street</label>
            <input className="w-full border border-gray-300 rounded-md px-3 py-2" name="street" value={editFields.street} onChange={handleEditChange} />
          </div>
          {/* Readonly fields */}
          <div className="space-y-4">
            <label className="block text-gray-400 text-sm mb-1">Subscription Status</label>
            <input className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-100" value={fallback(profile.subscription_status)} readOnly />
            <label className="block text-gray-400 text-sm mb-1">Referral Code</label>
            <input className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-100" value={fallback(profile.referral_code)} readOnly />
            <label className="block text-gray-400 text-sm mb-1">Joined</label>
            <input className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-100" value={fallback(profile.created_at)} readOnly />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button className="bg-gray-200 text-black rounded-md px-6 py-2" onClick={() => setEditMode(false)}>Cancel</button>
          <button className="bg-[#E51B1B] text-white rounded-md px-6 py-2" onClick={() => setModal("status")}>Save Changes</button>
        </div>
        {/* Save Changes Modal */}
        {modal === "status" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.03)" }}>
            <div className="bg-white rounded-md p-8 w-full max-w-md relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="none"><rect width="48" height="48" x="4" y="4" fill="#D1FADF" rx="24"/><rect width="48" height="48" x="4" y="4" stroke="#ECFDF3" strokeWidth="8" rx="24"/><path stroke="#039855" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m23.5 28 3 3 6-6m5.5 3c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10 10 4.477 10 10Z"/></svg>
                </div>
                <button className="text-gray-400" onClick={() => setModal(null)}>✕</button>
              </div>
              <div className="text-lg font-semibold mb-2">Save Changes</div>
              <div className="text-gray-600 mb-6">You are about to save profile changes.</div>
              <div className="flex justify-end gap-4">
                <button className="bg-gray-200 text-black rounded-md px-6 py-2" onClick={() => setModal(null)}>Cancel</button>
                <button className="bg-[#E51B1B] text-white rounded-md px-6 py-2" onClick={() => { setModal(null); setEditMode(false); }}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default Overview
  return (
    <div>
      {/* Basic User information header */}
      <div className="flex items-center justify-between rounded-md bg-gray-100 px-6 py-4 mb-6">
        <span className="text-black font-semibold text-base">Basic User information</span>
        <div className="relative">
          <button
            className="flex items-center gap-2 bg-white rounded-md px-4 py-2 border border-gray-400 text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition cursor-pointer"
            type="button"
            onClick={() => setShowActions((v) => !v)}
          >
            Actions
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showActions && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-50">
              <button
                className="flex items-center w-full px-4 py-3 hover:bg-gray-100"
                onClick={() => { setEditMode(true); setShowActions(false); }}
              >
                {/* Edit SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" className="mr-2"><path stroke="#737373" strokeLinecap="round" strokeLinejoin="round" d="m11.241 2.991 1.125-1.125a1.25 1.25 0 0 1 1.768 1.768l-7.08 7.079a3 3 0 0 1-1.264.754L4 12l.533-1.79a3 3 0 0 1 .754-1.265l5.954-5.954Zm0 0L13 4.75m-1 4.583V12.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 2 12.5v-7A1.5 1.5 0 0 1 3.5 4h3.167"/></svg>
                Edit Profile
              </button>
              <button
                className="flex items-center w-full px-4 py-3 hover:bg-gray-100"
                onClick={() => { setModal("deactivate"); setShowActions(false); }}
              >
                {/* Deactivate SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" className="mr-2"><path stroke="#737373" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.666 7h-4m-1.5-2.75a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-6.5 8.573v-.073a4.25 4.25 0 0 1 8.5 0V12.822A8.211 8.211 0 0 1 6.915 14a8.211 8.211 0 0 1-4.25-1.177Z"/></svg>
                Deactivate Profile
              </button>
              <button
                className="flex items-center w-full px-4 py-3 hover:bg-gray-100"
                onClick={() => { setModal("export"); setShowActions(false); }}
              >
                {/* Export SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" className="mr-2"><path fill="#737373" d="M11.137 9.138 8.47 11.804a.667.667 0 0 1-.943 0L4.861 9.138a.667.667 0 1 1 .942-.943l1.529 1.529V2a.667.667 0 0 1 1.333 0v7.724l1.529-1.53a.667.667 0 1 1 .943.944Z"/><path fill="#737373" d="M2.665 11.666a.667.667 0 0 0-1.333 0v1a2.667 2.667 0 0 0 2.667 2.667h8a2.667 2.667 0 0 0 2.666-2.667v-1a.667.667 0 0 0-1.333 0v1c0 .737-.597 1.334-1.333 1.334h-8a1.333 1.333 0 0 1-1.334-1.334v-1Z"/></svg>
                Export User Data
              </button>
              <button
                className="flex items-center w-full px-4 py-3 hover:bg-gray-100"
                onClick={() => { setModal("delete"); setShowActions(false); }}
              >
                {/* Delete SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" className="mr-2"><path stroke="#F04438" strokeLinecap="round" strokeLinejoin="round" d="M14 3.987a67.801 67.801 0 0 0-6.68-.334c-1.32 0-2.64.067-3.96.2L2 3.987M5.666 3.313l.147-.873c.106-.634.186-1.107 1.313-1.107h1.747c1.126 0 1.213.5 1.313 1.113l.147.867M12.567 6.094l-.433 6.713c-.074 1.047-.134 1.86-1.994 1.86H5.86c-1.86 0-1.92-.813-1.993-1.86l-.433-6.713"/></svg>
                Delete Profile
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Two-column info section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1 */}
        <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col gap-6">
          {/* Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaUser className="text-gray-400 w-5 h-5" />
              <div>
                <div className="text-gray-500 text-xs">Name</div>
                <div className="text-black font-medium">{fallback(profile.name)}</div>
              </div>
            </div>
            <FaRegCopy className="text-gray-400 w-4 h-4 cursor-pointer" />
          </div>
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaEnvelope className="text-gray-400 w-5 h-5" />
              <div>
                <div className="text-gray-500 text-xs">Email</div>
                <div className="text-black font-medium">{fallback(profile.email)}</div>
              </div>
            </div>
            <FaRegCopy className="text-gray-400 w-4 h-4 cursor-pointer" />
          </div>
          {/* Role */}
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Role</div>
              <div className="text-black font-medium">{fallback(profile.role)}</div>
            </div>
          </div>
          {/* Linked Dojo */}
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Linked Dojo</div>
              <div className="text-black font-medium">{fallback(profile.linkedDojo)}</div>
            </div>
          </div>
          {/* Joined */}
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Joined</div>
              <div className="text-black font-medium">{fallback(profile.created_at)}</div>
            </div>
          </div>
          {/* City */}
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">City</div>
              <div className="text-black font-medium">{fallback(profile.city)}</div>
            </div>
          </div>
          {/* Street */}
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Street</div>
              <div className="text-black font-medium">{fallback(profile.street)}</div>
            </div>
          </div>
          {/* Subscription Status */}
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Subscription Status</div>
              <div className="text-black font-medium">{fallback(profile.subscription_status)}</div>
            </div>
          </div>
          {/* Referral Code */}
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Referral Code</div>
              <div className="text-black font-medium">{fallback(profile.referral_code)}</div>
            </div>
          </div>
        </div>
        {/* Column 2 */}
        <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col gap-6">
          {/* Next of Kin's Full Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaUser className="text-gray-400 w-5 h-5" />
              <div>
                <div className="text-gray-500 text-xs">Next of kin's full name</div>
                <div className="text-black font-medium">-</div>
              </div>
            </div>
            <FaRegCopy className="text-gray-400 w-4 h-4 cursor-pointer" />
          </div>
          {/* Next of Kin's Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaEnvelope className="text-gray-400 w-5 h-5" />
              <div>
                <div className="text-gray-500 text-xs">Next of kin's email</div>
                <div className="text-black font-medium">-</div>
              </div>
            </div>
            <FaRegCopy className="text-gray-400 w-4 h-4 cursor-pointer" />
          </div>
          {/* Relationship */}
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Relationship</div>
              <div className="text-black font-medium">-</div>
            </div>
          </div>
          {/* Number of Children */}
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Number of children</div>
              <div className="text-black font-medium">-</div>
            </div>
          </div>
          {/* Class Group(s) */}
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Class group(s)</div>
              <div className="text-black font-medium">-</div>
            </div>
          </div>
          {/* Subscription Status (future) */}
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Subscription status</div>
              <div className="text-black font-medium">-</div>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivate Modal */}
      {modal === "deactivate" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.03)" }}>
          <div className="bg-white rounded-md p-8 w-full max-w-md relative">
            <div className="flex items-center justify-between mb-4">
              {/* Deactivate SVG */}
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" fill="none"><g filter="url(#a)"><rect width="48" height="48" x="2" y="1" fill="#fff" rx="10"/><rect width="47" height="47" x="2.5" y="1.5" stroke="#E9EAEB" rx="9.5"/><path fill="#E51B1B" d="M25 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM16.046 28.253c-.058.468.172.92.57 1.175A9.953 9.953 0 0 0 22 31c1.982 0 3.83-.578 5.384-1.573.398-.254.628-.707.57-1.175a6.001 6.001 0 0 0-11.908 0ZM26.75 20.75a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z"/></g><defs><filter id="a" width="52" height="52" x="0" y="0" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dy="1"/><feGaussianBlur stdDeviation="1"/><feColorMatrix values="0 0 0 0 0.0392157 0 0 0 0 0.0509804 0 0 0 0 0.0705882 0 0 0 0.05 0"/><feBlend in2="BackgroundImageFix" result="effect1_dropShadow_11290_35768"/><feBlend in="SourceGraphic" in2="effect1_dropShadow_11290_35768" result="shape"/></filter></defs></svg>
              </div>
              <button className="text-gray-400" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="text-lg font-semibold text-center mb-2">Deactivate Profile</div>
            <div className="text-gray-600 text-center mb-6">Are you sure you want to deactivate this profile? The user can be reactivated back.</div>
            <div className="flex justify-end gap-4">
              <button className="bg-gray-200 text-black rounded-md px-6 py-2" onClick={() => setModal(null)}>Cancel</button>
              <button className="bg-[#E51B1B] text-white rounded-md px-6 py-2">Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {modal === "export" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.03)" }}>
          <div className="bg-white rounded-md p-8 w-full max-w-md relative">
            <div className="flex items-center justify-between mb-4">
              {/* Export SVG */}
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"><path fill="#737373" d="M11.137 9.138 8.47 11.804a.667.667 0 0 1-.943 0L4.861 9.138a.667.667 0 1 1 .942-.943l1.529 1.529V2a.667.667 0 0 1 1.333 0v7.724l1.529-1.53a.667.667 0 1 1 .943.944Z"/><path fill="#737373" d="M2.665 11.666a.667.667 0 0 0-1.333 0v1a2.667 2.667 0 0 0 2.667 2.667h8a2.667 2.667 0 0 0 2.666-2.667v-1a.667.667 0 0 0-1.333 0v1c0 .737-.597 1.334-1.333 1.334h-8a1.333 1.333 0 0 1-1.334-1.334v-1Z"/></svg>
              </div>
              <button className="text-gray-400" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="text-lg font-semibold text-center mb-2">Export User Data</div>
            <div className="text-gray-600 text-center mb-6">Exporting user data...</div>
            <div className="flex justify-end gap-4">
              <button className="bg-gray-200 text-black rounded-md px-6 py-2" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.03)" }}>
          <div className="bg-white rounded-md p-8 w-full max-w-md relative">
            <div className="flex items-center justify-between mb-4">
              {/* Delete SVG */}
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="none"><rect width="48" height="48" x="4" y="4" fill="#FEE4E2" rx="24"/><rect width="48" height="48" x="4" y="4" stroke="#FEF3F2" strokeWidth="8" rx="24"/><path stroke="#D92D20" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M32 22v-.8c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C30.48 18 29.92 18 28.8 18h-1.6c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C24 19.52 24 20.08 24 21.2v.8m2 5.5v5m4-5v5M19 22h18m-2 0v11.2c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C32.72 38 31.88 38 30.2 38h-4.4c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C21 35.72 21 34.88 21 33.2V22"/></svg>
              </div>
              <button className="text-gray-400" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="text-lg font-semibold text-center mb-2">Delete Profile</div>
            <div className="text-gray-600 text-center mb-6">Are you sure you want to delete this profile? This action cannot be undone.</div>
            <div className="flex justify-end gap-4">
              <button className="bg-gray-200 text-black rounded-md px-6 py-2" onClick={() => setModal(null)}>Cancel</button>
              <button className="bg-[#E51B1B] text-white rounded-md px-6 py-2">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}