import React, { useState } from "react";
import ProfileFormModal from "./ProfileFormModal";
import ConfirmProfileModal from "./ConfirmProfileModal";

const userTypes = [
  {
    key: "admin",
    title: "Dojo Admin",
    desc: "Create a profile for a dojo owner",
  },
  {
    key: "instructor",
    title: "Instructor",
    desc: "Create a profile for a dojo instructor",
  },
  {
    key: "parent",
    title: "Parent",
    desc: "Create a profile for a parent",
  },
];

const icons = {
  admin: (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none"><path d="M15.3332 12.6668H14.6665V6.0001H11.9998V4.39062L7.99984 0.390625L3.99984 4.39062V6.0001H1.33317V12.6668H0.666504V14.0001H15.3332V12.6668ZM3.99984 12.6668H2.6665V7.3335H3.99984V12.6668ZM11.9998 7.3335H13.3332V12.6668H11.9998V7.3335ZM7.33317 8.00016H8.6665V12.6668H7.33317V8.00016Z" fill="#E93333"/></svg>
  ),
  instructor: (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M3.33333 1.66683C3.33333 2.40321 2.73638 3.00016 2 3.00016C1.26362 3.00016 0.666667 2.40321 0.666667 1.66683C0.666667 0.930449 1.26362 0.333496 2 0.333496C2.73638 0.333496 3.33333 0.930449 3.33333 1.66683ZM1.33333 9.66683V13.6668H0V5.66683C0 4.56226 0.895433 3.66683 2 3.66683C2.54706 3.66683 3.04282 3.88647 3.4039 4.24238L4.98687 5.7373L6.52873 4.19542L7.47153 5.13824L5.0134 7.59636L4 6.6393V13.6668H2.66667V9.66683H1.33333ZM4.66667 2.3335H10.6667V8.3335H4.66667V9.66683H7.57693L9.45927 13.6668H10.9329L9.05053 9.66683H11.3333C11.7015 9.66683 12 9.36836 12 9.00016V1.66683C12 1.29864 11.7015 1.00016 11.3333 1.00016H4.66667V2.3335Z" fill="#E93333"/></svg>
  ),
  parent: (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none"><path d="M3.66683 6.3335C2.00998 6.3335 0.666829 4.99035 0.666829 3.3335C0.666829 1.67664 2.00998 0.333496 3.66683 0.333496C5.32368 0.333496 6.66683 1.67664 6.66683 3.3335C6.66683 4.99035 5.32368 6.3335 3.66683 6.3335ZM10.6668 9.00016C9.1941 9.00016 8.00016 7.80623 8.00016 6.3335C8.00016 4.86074 9.1941 3.66683 10.6668 3.66683C12.1396 3.66683 13.3335 4.86074 13.3335 6.3335C13.3335 7.80623 12.1396 9.00016 10.6668 9.00016ZM10.6668 9.66683C12.3237 9.66683 13.6668 11.01 13.6668 12.6668V13.0002H7.66683V12.6668C7.66683 11.01 9.00996 9.66683 10.6668 9.66683ZM3.66683 7.00016C5.50778 7.00016 7.00016 8.49256 7.00016 10.3335V13.0002H0.333496V10.3335C0.333496 8.49256 1.82588 7.00016 3.66683 7.00016Z" fill="#E93333"/></svg>
  ),
};

const CreateProfileModal = ({ onClose }: { onClose: () => void }) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  // Actually submit to backend after confirm
  const handleConfirm = async () => {
    if (!pendingPayload) return;
    try {
      await fetch("https://backoffice-api.dojoconnect.app/create_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingPayload),
      });
      setShowConfirm(false);
      setShowProfileForm(false);
      setSelectedType(null);
      setPendingPayload(null);
      onClose();
    } catch {
      setShowConfirm(false);
      setShowProfileForm(false);
      setSelectedType(null);
      setPendingPayload(null);
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.05)" }}
        onClick={onClose}
      />
      {/* Modal Card */}
      {!showProfileForm && !showConfirm && (
  <div className="fixed inset-0 z-60 flex items-center justify-center">
    <div
      className="bg-white rounded-xl shadow-lg w-[500px] p-8 border border-gray-200"
      style={{ maxWidth: 540 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-start mb-4">
        {/* Optional: Add a main icon here if you want */}
        <span className="text-black font-semibold text-xl ml-0">Create a Profile</span>
        <button
          className="ml-auto text-gray-400 hover:text-gray-600 rounded-full p-1"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      {/* Subtext */}
      <div className="text-gray-500 text-sm mb-3">Select user type</div>
      {/* User Type Cards */}
      <div className="flex flex-col gap-3 mb-5">
        {userTypes.map((type) => (
          <button
            key={type.key}
            type="button"
            className={`flex items-center justify-between border rounded-md px-4 py-3 transition
              ${selectedType === type.key
                ? "border-red-600 bg-red-50"
                : "border-gray-200 bg-white hover:border-red-400"}
            `}
            onClick={() => setSelectedType(type.key)}
          >
          <div className="flex items-start gap-3">
  <span className="mt-1">{icons[type.key as keyof typeof icons]}</span>
  <div className="flex flex-col justify-start">
    <span className="text-sm font-semibold text-[#101928]">{type.title}</span>
    <span className="text-xs text-gray-500">{type.desc}</span>
  </div>
</div>
            {/* Custom Checkbox */}
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition
                ${selectedType === type.key
                  ? "bg-red-600 border-red-600"
                  : "border-gray-300 bg-white"}
              `}
              style={{ minWidth: 24, minHeight: 24 }}
            >
              {selectedType === type.key && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4 7.5L6.5 10L10 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
          </button>
        ))}
      </div>
      {/* Continue Button */}
      <button
        className={`w-full py-2 rounded-md font-semibold text-white transition
          ${selectedType
            ? "bg-red-600 hover:bg-red-700"
            : "bg-red-200 cursor-not-allowed"}
        `}
        disabled={!selectedType}
        onClick={() => setShowProfileForm(true)}
      >
        Continue
      </button>
    </div>
  </div>
)}
      {/* Profile Form Modal */}
      {showProfileForm && !showConfirm && (
        <ProfileFormModal
          type={selectedType}
          onClose={() => {
            setShowProfileForm(false);
            setSelectedType(null);
          }}
          onConfirm={payload => {
            setPendingPayload(payload);
            setShowConfirm(true);
          }}
        />
      )}
      {/* Confirm Modal */}
      {showConfirm && (
        <ConfirmProfileModal
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
};

export default CreateProfileModal;