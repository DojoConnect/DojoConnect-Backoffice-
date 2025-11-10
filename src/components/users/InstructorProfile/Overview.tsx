import React, { useState } from "react";
import { useUserClasses } from "../../../hooks/useUserClasses";
import { FaUser, FaEnvelope, FaCopy, FaCalendarAlt, FaEllipsisH, FaChevronDown, FaChevronUp, FaCheckCircle } from "react-icons/fa";


interface OverviewProps {
  profile: {
    id: number;
    name: string;
    email: string;
    userType: string;
    joined_date: string;
    activityLog: string;
    status: string;
    avatar: string;
    age?: number;
    gender?: string;
    assigned_classes?: string[];
    assigned_dates?: string[];
    assignedDojos?: string[];
    notes?: string;
    classes?: {
      img: string;
      name: string;
      level: string;
      instructor: string;
      duration: string;
      frequency: string;
      status: string;
      statusColor: string;
    }[];
    activities?: {
      title: string;
      date: string;
    }[];
  };
}

const statusOptions = [
  { label: "Active", color: "bg-green-700", text: "text-gray-700", value: "active" },
  { label: "Inactive", color: "bg-red-600", text: "text-gray-700", value: "inactive" },
  { label: "Disable", color: "bg-gray-400", text: "text-gray-700", value: "disable" },
];

const Overview: React.FC<OverviewProps & { email: string }> = ({ profile, email }) => {
  const { classes, loading, error } = useUserClasses(email);
  const [showActions, setShowActions] = useState(false);
  const [modal, setModal] = useState<null | "deactivate" | "export" | "delete" | "saveConfirm">(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name: profile.name,
    email: profile.email,
    age: profile.age ?? "",
    gender: profile.gender ?? "",
  });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("active");

  // Use API classes if available, else fallback to profile.classes, else []
  const assignedClasses =
    !loading && classes.length > 0
      ? classes
      : !loading && profile.classes && profile.classes.length > 0
      ? profile.classes
      : [];

  const activityLog = profile.activities && profile.activities.length > 0 ? profile.activities : [];

  // For Save Changes modal
  const handleSave = () => {
    setModal("saveConfirm");
    setIsEditing(false);
    setShowStatusModal(false);
    setShowActions(false);
  };

  return (
    <div className="space-y-8">
      {/* Section 1 */}
      <div className="flex items-center justify-between bg-gray-100 rounded-md px-4 py-2 mb-4 w-full">
        <span className="text-gray-700 font-semibold">Basic user information</span>
        <div className="relative">
          <button
            className="flex items-center border border-gray-500 rounded-md px-6 py-3 bg-white text-black cursor-pointer"
            onClick={() => {
              setShowActions((v) => !v);
              if (isEditing) setShowStatusModal((s) => !s);
            }}
          >
            Actions
            {isEditing ? (
              <FaChevronUp className="w-4 h-4 text-gray-700 ml-2" />
            ) : (
              <FaChevronDown className="w-4 h-4 text-gray-700 ml-2" />
            )}
          </button>
          {/* Status modal when editing */}
          {isEditing && showStatusModal && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-50 p-4">
              {statusOptions.map((opt, idx) => (
  <div
    key={opt.value}
    className={`flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 rounded-md`}
    onClick={() => setSelectedStatus(opt.value)}
  >
    <span className={`flex items-center gap-2`}>
      <span className={`inline-block w-3 h-3 rounded-full ${opt.color}`}></span>
      <span className={`text-sm ${opt.text}`}>{opt.label}</span>
    </span>
    {selectedStatus === opt.value && (
      <FaCheckCircle className="text-red-600 text-lg bg-transparent" />
    )}
  </div>
))}
            </div>
          )}
          {/* Actions dropdown when not editing */}
          {!isEditing && showActions && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-50">
              <button
                className="flex items-center w-full px-4 py-3 hover:bg-gray-100"
                onClick={() => {
                  setIsEditing(true);
                  setShowActions(false);
                  setShowStatusModal(false);
                }}
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
      {/* Two columns below */}
      <div className="grid grid-cols-2 gap-6">
        {/* Column 1 */}
       <div className="border border-gray-300 rounded-md bg-gray-50 p-6 space-y-6">
  {/* Full Name */}
  <div className="flex items-center justify-between min-h-[48px]">
    <div className="flex items-center">
      <FaUser className="text-gray-400 mr-3 text-xl" />
      <div>
        <div className="text-xs text-gray-500">Full Name</div>
        {isEditing ? (
          <input
            className="text-base text-black font-semibold border rounded px-2 py-1"
            value={editValues.name}
            onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
          />
        ) : (
          <div className="text-base text-black font-semibold">{profile.name}</div>
        )}
      </div>
    </div>
    <FaCopy className="text-gray-400 cursor-pointer" />
  </div>
  {/* Email */}
  <div className="flex items-center justify-between min-h-[48px]">
    <div className="flex items-center">
      <FaEnvelope className="text-gray-400 mr-3 text-xl" />
      <div>
        <div className="text-xs text-gray-500">Email</div>
        {isEditing ? (
          <input
            className="text-base text-black border rounded px-2 py-1"
            value={editValues.email}
            onChange={e => setEditValues(v => ({ ...v, email: e.target.value }))}
          />
        ) : (
          <div className="text-base text-black">{profile.email}</div>
        )}
      </div>
    </div>
    <FaCopy className="text-gray-400 cursor-pointer" />
  </div>
  {/* Role */}
  <div className="flex items-center justify-between min-h-[48px]">
    <div className="flex items-center">
      <FaUser className="text-gray-400 mr-3 text-xl" />
      <div>
        <div className="text-xs text-gray-500">Role</div>
        <div className="text-base text-black">{profile.userType}</div>
      </div>
    </div>
  </div>
  {/* Age */}
  <div className="flex items-center justify-between min-h-[48px]">
    <div className="flex items-center">
      <FaUser className="text-gray-400 mr-3 text-xl" />
      <div>
        <div className="text-xs text-gray-500">Age</div>
        {isEditing ? (
          <input
            className="text-base text-black border rounded px-2 py-1"
            value={editValues.age}
            onChange={e => setEditValues(v => ({ ...v, age: e.target.value }))}
          />
        ) : (
          <div className="text-base text-black">{profile.age ?? "-"}</div>
        )}
      </div>
    </div>
  </div>
  {/* Gender */}
  <div className="flex items-center justify-between min-h-[48px]">
    <div className="flex items-center">
      <FaUser className="text-gray-400 mr-3 text-xl" />
      <div>
        <div className="text-xs text-gray-500">Gender</div>
        {isEditing ? (
          <input
            className="text-base text-black border rounded px-2 py-1"
            value={editValues.gender}
            onChange={e => setEditValues(v => ({ ...v, gender: e.target.value }))}
          />
        ) : (
          <div className="text-base text-black">{profile.gender ?? "-"}</div>
        )}
      </div>
    </div>
  </div>
  {/* Joined */}
  <div className="flex items-center justify-between min-h-[48px]">
    <div className="flex items-center">
      <FaCalendarAlt className="text-gray-400 mr-3 text-xl" />
      <div>
        <div className="text-xs text-gray-500">Joined</div>
        <div className="text-base text-black">{profile.joined_date || "-"}</div>
      </div>
    </div>
  </div>
</div>
       {/* Column 2 */}
        <div className="border border-gray-300 rounded-md bg-gray-50 p-6 space-y-6">
            <div>
            <div className="text-xs text-gray-500">Assigned Dojo(s)</div>
            {(profile.assignedDojos || profile.assigned_dojos || []).map((dojo: string, idx: number) => (
              <div key={idx} className="text-base text-black">{dojo}</div>
            ))}
            </div>
            <div>
            <div className="text-xs text-gray-500">Assigned Classes</div>
            {(profile.assignedClasses || profile.assigned_classes || []).map((cls: any, idx: number) => (
              <div key={cls.class_uid || cls.id || idx} className="text-base text-black">
              {cls.class_name || cls.name || "-"}
              </div>
            ))}
            </div>
            <div>
            <div className="text-xs text-gray-500">Activity Log</div>
            {(profile.activityLog || profile.activity_log || []).map((act: any, idx: number) => (
              <div key={idx} className="text-base text-black">
              {act.type || act.title || "-"} - {act.date || "-"}
              </div>
            ))}
            </div>
            <div>
            <div className="text-xs text-gray-500">Classes</div>
            {(profile.classes || []).map((cls: any, idx: number) => (
              <div key={cls.class_uid || cls.id || idx} className="text-base text-black">
              {cls.name || "-"}
              </div>
            ))}
            </div>
            <div>
            <div className="text-xs text-gray-500">Activities</div>
            {(profile.activities || []).map((act: any, idx: number) => (
              <div key={idx} className="text-base text-black">
              {act.title || "-"} - {act.date || "-"}
              </div>
            ))}
            </div>
          <div>
            <div className="text-xs text-gray-500">Assigned Dates</div>
            {(profile.assignedDates || profile.assigned_dates || []).map((date: string, idx: number) => (
              <div key={idx} className="text-base text-black">{date}</div>
            ))}
          </div>
          <div>
            <div className="text-xs text-gray-500">Notes</div>
            <div className="min-h-[56px]">{profile.notes ?? ""}</div>
          </div>
        </div>
      </div>
      {/* Edit buttons below both columns */}
      {isEditing && (
        <div className="flex justify-end gap-4 mt-4">
          <button
            className="bg-white border border-gray-300 text-black rounded-md px-6 py-2"
            onClick={() => {
              setIsEditing(false);
              setShowStatusModal(false);
              setEditValues({
                name: profile.name,
                email: profile.email,
                age: profile.age ?? "",
                gender: profile.gender ?? "",
              });
            }}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 text-white rounded-md px-6 py-2"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      )}
      {/* Section 2 */}
      <div className="flex gap-6">
      {/* Assigned Classes */}
      <div>
        <div className="bg-gray-100 rounded-md px-4 py-2 mb-2">
          <span className="text-gray-700 font-semibold">
            Assigned Classes ({(profile.assigned_classes || []).length})
          </span>
        </div>
        {(profile.assigned_classes || []).length === 0 ? (
          <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center min-h-[120px]">
            <span>No classes in this profile yet ..</span>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-gray-200 p-4 flex flex-col gap-4">
            {(profile.assigned_classes || []).map((cls: any, idx: number) => (
              <div key={cls.class_uid || cls.id || idx} className="flex items-center gap-4">
                <img
                  src={`/${cls.image_path || "classImage.png"}`}
                  alt={cls.class_name}
                  className="w-10 h-10 rounded-md"
                />
                <div>
                  <div className="font-semibold">{cls.class_name} {cls.level ? `- ${cls.level}` : ""}</div>
                  <div className="text-xs text-gray-500">{cls.instructor || ""}</div>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-700">
                  {cls.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
         {/* Activity Log */}
      <div>
        <div className="bg-gray-100 rounded-md px-4 py-2 mb-2">
          <span className="text-gray-700 font-semibold">
            Activity Log
          </span>
        </div>
        {(profile.activity_log || []).length === 0 ? (
          <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center min-h-[120px]">
            <span>No activities in this profile yet ...</span>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-gray-200 p-4 flex flex-col gap-4">
            {(profile.activity_log || []).map((act: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-4">
                <div>
                  <div className="font-semibold text-black">{act.type || act.title || "-"}</div>
                  <div className="text-xs text-gray-500">{act.date || "-"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      {/* Modals */}
    {modal === "saveConfirm" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.03)" }}>
    <div className="bg-white rounded-md p-8 w-full max-w-md relative">
      <div className="flex items-start justify-between mb-4">
        {/* Green SVG aligned to flex-start */}
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="48" height="48" rx="24" fill="#D1FADF"/>
          <rect x="4" y="4" width="48" height="48" rx="24" stroke="#ECFDF3" strokeWidth="8"/>
          <path d="M23.5 28L26.5 31L32.5 25M38 28C38 33.5228 33.5228 38 28 38C22.4772 38 18 33.5228 18 28C18 22.4772 22.4772 18 28 18C33.5228 18 38 22.4772 38 28Z" stroke="#039855" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {/* Close button aligned to flex-start */}
        <span className="text-gray-400 cursor-pointer text-lg ml-auto" onClick={() => setModal(null)}>✕</span>
      </div>
      {/* Title and description aligned to flex-start */}
      <div className="text-lg font-semibold text-black mb-2 text-left">Save Changes</div>
      <div className="text-gray-600 text-left mb-6">You are about to save profile changes.</div>
      <div className="flex justify-end gap-4">
        <button className="bg-white border border-gray-300 text-black rounded-md px-6 py-2" onClick={() => setModal(null)}>
          Cancel
        </button>
        <button className="bg-red-600 text-white rounded-md px-6 py-2" onClick={() => setModal(null)}>
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
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
};

export default Overview;