import React from "react";

export default function ProfileTabs({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <div className="flex gap-8 border-b border-gray-200 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`pb-2 text-base font-medium transition-colors cursor-pointer
            ${activeTab === tab
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-500 border-b-2 border-transparent hover:text-red-600"}
            bg-transparent
          `}
          style={{ outline: "none", background: "none" }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}