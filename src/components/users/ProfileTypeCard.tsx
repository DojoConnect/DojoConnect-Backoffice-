import React from "react";

const ProfileTypeCard = ({
  icon,
  title,
  desc,
  checked,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onClick: () => void;
}) => (
  <div
    className={`flex items-center justify-between border rounded-md px-4 py-3 cursor-pointer transition
      ${checked ? "border-red-600" : "border-gray-300"}
      hover:border-red-600`}
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <span>{icon}</span>
      <div>
        <div className="font-semibold text-black">{title}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
    </div>
    {/* Custom Checkbox */}
    <span
      className={`w-6 h-6 flex items-center justify-center rounded-full border
        ${checked ? "bg-red-600 border-red-600" : "bg-white border-gray-300"}`}
      style={{ transition: "all 0.2s" }}
    >
      {checked && (
        <svg width="16" height="16" fill="none">
          <path d="M4 8l3 3 5-5" stroke="#fff" strokeWidth="2" />
        </svg>
      )}
    </span>
  </div>
);

export default ProfileTypeCard;