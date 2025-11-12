import React from "react";

export type Tab = "Overview" | "Instructors" | "Classes" | "Parents" | "Students" | "Calendar" | "Subscription" | "Activities";

export default function ProfileTabs({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: Tab[];
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 sm:gap-8 border-b border-gray-200 mb-8 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`pb-2 text-[13px] sm:text-base font-medium transition-colors cursor-pointer whitespace-nowrap
            ${activeTab === tab
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-500 border-b-2 border-transparent hover:text-red-600"}
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}