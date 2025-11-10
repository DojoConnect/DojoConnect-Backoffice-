'use client';
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaFilter, FaDownload, FaPlus } from "react-icons/fa";
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronUp } from "react-icons/fi";
import UsersTable from "./UsersTable";
import UserSummary from "./UserSummary";
import Pagination from "./Pagination";
import ExportModal from './ExportModal';
import CreateProfileModal from "./CreateProfileModal";

const FILTERS = [
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
  { label: "All time", value: "all" },
  { label: "Custom date", value: "custom" },
];

const ROLE_DISPLAY_MAP: Record<string, string> = {
  admin: "School Admin",
  instructor: "Instructor",
  parent: "Parent",
  child: "Student",
  student: "Student",
};

const TABS = [
  { label: "All Users", value: "all" },
  { label: "School Admins", value: "admin" },
  { label: "Instructors", value: "instructor" },
  { label: "Parents", value: "parent" },
  { label: "Students", value: "student" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const YEARS = Array.from({ length: 20 }, (_, i) => 2016 + i);


export default function UsersPage() {
const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [activeFilter, setActiveFilter] = useState("today");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [customRange, setCustomRange] = useState<{ start?: string, end?: string }>({});
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [monthPage, setMonthPage] = useState(0);
  const [yearPage, setYearPage] = useState(0);
  const [tempMonth, setTempMonth] = useState(calendarMonth);
  const [tempYear, setTempYear] = useState(calendarYear);
  const [highlightRange, setHighlightRange] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });

  const [showExportModal, setShowExportModal] = useState(false);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  // Fetch users from backend with filter
  useEffect(() => {
    setLoading(true);
    let body: any = { period: activeFilter };
    if (activeFilter === "custom" && customRange.start && customRange.end) {
      body.startDate = customRange.start;
      body.endDate = customRange.end;
    }
    fetch("https://backoffice-api.dojoconnect.app/get_users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setUsers(
            data.data.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              userType: ROLE_DISPLAY_MAP[u.role] || u.role,
              joinedDate: u.created_at ? u.created_at.split(" ")[0] : "",
              lastActivity: u.last_activity || "-",
              status: u.subscription_status ? u.subscription_status.charAt(0).toUpperCase() + u.subscription_status.slice(1) : "Inactive",
              avatar: u.avatar && u.avatar !== "" ? u.avatar : "/default-avatar.png",
            }))
          );
        } else {
          setUsers([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setUsers([]);
        setLoading(false);
      });
  }, [activeFilter, customRange]);

  // Filtered users for current tab
 const filteredUsers =
  activeTab === "all"
    ? users
    : activeTab === "student"
      ? users.filter((u) => ["student", "child"].includes((u.role || "").toLowerCase()))
      : users.filter((u) => (u.role || "").toLowerCase() === activeTab);

  // Filtered users for current page
  const pagedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, users]);

  // Count for each backend role
  const getCount = (type: string) =>
    type === "all"
      ? users.length
      : users.filter((u) => u.role === type).length;
      
 const handleUserClick = (user: any) => {
    if ((user.role || "").toLowerCase() === "admin") {
    router.push(`/dashboard/users/school-admin/${user.id}`);
  } else if ((user.role || "").toLowerCase() === "instructor") {
    router.push(`/dashboard/users/instructor/${user.id}`);
  } else if ((user.role || "").toLowerCase() === "parent") {
    router.push(`/dashboard/users/parent/${user.id}`);
  } else if (["student", "child"].includes((user.role || "").toLowerCase())) {
    router.push(`/dashboard/users/student/${user.id}`);
  } else {
    router.push(`/dashboard/users/${user.id}`);
  }
};


  // Counts for summary
  const adminCount = users.filter(u => (u.role || "").toLowerCase() === "admin").length;
const instructorCount = users.filter(u => (u.role || "").toLowerCase() === "instructor").length;
const parentCount = users.filter(u => (u.role || "").toLowerCase() === "parent").length;
const studentCount = users.filter(u => ["student", "child"].includes((u.role || "").toLowerCase())).length;

  // Calendar logic
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const prevMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => ({
    day: new Date(calendarYear, calendarMonth, -firstDayOfWeek + i + 1).getDate(),
    isPrev: true
  }));
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    isPrev: false
  }));
  const calendarDays = [...prevMonthDays, ...monthDays];

  return (
    <div className="px-0 md:px-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h1 className="text-2xl text-[#0F1828] font-semibold">Users</h1>
        <div className="flex flex-wrap gap-2 sm:justify-end relative">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`px-4 py-1 border rounded-full whitespace-nowrap flex items-center gap-1 cursor-pointer
                ${activeFilter === f.value
                  ? 'bg-red-100 text-red-600 border-red-300'
                  : 'bg-white text-gray-600 border-gray-300'
                }`}
              onClick={() => {
                setActiveFilter(f.value);
                if (f.value === "custom") setShowCalendar(true);
                else setShowCalendar(false);
              }}
            >
              {f.label}
              {f.value === "custom" && <FiChevronDown className="text-gray-500 text-lg" />}
            </button>
          ))}
        </div>
      </div>
      {/* Calendar Modal */}
      {showCalendar && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.03)' }}
            onClick={() => setShowCalendar(false)}
          />
          <div
            className="absolute z-50 mt-2 right-8 bg-white rounded-xl p-6 shadow-2xl border border-gray-300 w-[340px] h-[350px] flex flex-col"
            style={{ minWidth: 280, paddingRight: 16 }}
          >
            {/* Month/Year Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-black font-semibold text-lg cursor-pointer"
                  onClick={() => {
                    setShowMonthYearModal(true);
                    setShowCalendar(false);
                  }}
                >
                  {MONTHS[calendarMonth]} {calendarYear}
                </span>
                <button
                  className="ml-1 cursor-pointer"
                  onClick={() => {
                    setShowMonthYearModal(true);
                    setShowCalendar(false);
                  }}
                >
                  <FiChevronDown className="text-[#E51B1B] text-xl" />
                </button>
              </div>
              <div className="flex gap-4 ml-2">
                <button
                  className="cursor-pointer"
                  onClick={() => setCalendarMonth(m => m === 0 ? 11 : m - 1)}
                >
                  <FiChevronLeft className="text-[#E51B1B] text-xl" />
                </button>
                <button
                  className="cursor-pointer"
                  onClick={() => setCalendarMonth(m => m === 11 ? 0 : m + 1)}
                >
                  <FiChevronRight className="text-[#E51B1B] text-xl" />
                </button>
              </div>
            </div>
            {/* Days of week */}
            <div className="grid grid-cols-7 text-xs text-gray-400 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 mb-2 flex-1">
              {calendarDays.map(({ day, isPrev }, idx) => {
                let highlightClass = "";
                if (
                  !isPrev &&
                  highlightRange.start !== null &&
                  highlightRange.end !== null &&
                  day >= Math.min(highlightRange.start, highlightRange.end) &&
                  day <= Math.max(highlightRange.start, highlightRange.end)
                ) {
                  if (day === highlightRange.start || day === highlightRange.end) {
                    highlightClass = "bg-red-100 border border-red-500 text-black";
                  } else {
                    highlightClass = "bg-red-100 text-black";
                  }
                } else if (isPrev) {
                  highlightClass = "bg-gray-100 text-gray-300";
                } else {
                  highlightClass = "bg-white text-gray-700";
                }
                return (
                  <button
                    key={idx}
                    className={`py-2 rounded text-sm w-8 h-8 ${highlightClass} hover:border hover:border-red-500 cursor-pointer`}
                    disabled={isPrev}
                    onClick={() => {
                      if (!isPrev) {
                        // Range selection logic: click once for start, again for end
                        if (highlightRange.start === null || (highlightRange.start !== null && highlightRange.end !== null)) {
                          setHighlightRange({ start: day, end: null });
                        } else {
                          setHighlightRange({ start: highlightRange.start, end: day });
                          // Set custom range and close calendar
                          const start = new Date(calendarYear, calendarMonth, highlightRange.start!);
                          const end = new Date(calendarYear, calendarMonth, day);
                          setCustomRange({
                            start: start.toISOString().slice(0, 10),
                            end: end.toISOString().slice(0, 10)
                          });
                          setActiveFilter("custom");
                          setShowCalendar(false);
                        }
                        setSelectedDate(new Date(calendarYear, calendarMonth, day));
                      }
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      {/* Month/Year Picker Modal */}
      {showMonthYearModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.03)' }}
            onClick={() => {
              setShowMonthYearModal(false);
              setShowCalendar(true);
            }}
          />
          <div className="absolute z-50 mt-2 right-8 bg-white rounded-xl p-6 shadow-2xl border border-gray-300 w-[400px] flex flex-col" style={{ minWidth: 340 }}>
            {/* Month/Year Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-black font-semibold text-lg">{MONTHS[tempMonth]} {tempYear}</span>
                <FiChevronUp className="text-[#E51B1B] text-xl ml-2" />
              </div>
            </div>
            {/* Month Section */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 font-semibold">Month</span>
              <div className="flex gap-4">
                <button
                  className="cursor-pointer"
                  onClick={() => setMonthPage(p => Math.max(0, p - 1))}
                  disabled={monthPage === 0}
                >
                  <FiChevronLeft className="text-[#E51B1B] text-xl" />
                </button>
                <button
                  className="cursor-pointer"
                  onClick={() => setMonthPage(p => p < 2 ? p + 1 : p)}
                  disabled={monthPage >= 2}
                >
                  <FiChevronRight className="text-[#E51B1B] text-xl" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {MONTHS.slice(monthPage * 4, monthPage * 4 + 4).map((m, idx) => {
                const isActive = tempMonth === monthPage * 4 + idx;
                return (
                  <button
                    key={m}
                    className={`py-2 px-2 rounded-md border text-xs font-semibold cursor-pointer
                      ${isActive ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-50 border-gray-300 text-gray-700'}`}
                    onClick={() => setTempMonth(monthPage * 4 + idx)}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            {/* Year Section */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 font-semibold">Year</span>
              <div className="flex gap-4">
                <button
                  className="cursor-pointer"
                  onClick={() => setYearPage(p => Math.max(0, p - 1))}
                  disabled={yearPage === 0}
                >
                  <FiChevronLeft className="text-[#E51B1B] text-xl" />
                </button>
                <button
                  className="cursor-pointer"
                  onClick={() => setYearPage(p => (yearPage + 1) * 5 < YEARS.length ? p + 1 : p)}
                  disabled={(yearPage + 1) * 5 >= YEARS.length}
                >
                  <FiChevronRight className="text-[#E51B1B] text-xl" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {YEARS.slice(yearPage * 5, yearPage * 5 + 5).map((y) => (
                <button
                  key={y}
                  className={`py-2 px-2 rounded-md border text-xs font-semibold cursor-pointer
                    ${tempYear === y ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-50 border-gray-300 text-gray-700'}`}
                  onClick={() => setTempYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-4 py-1 rounded-md bg-white text-gray-600 border-none cursor-pointer"
                onClick={() => {
                  setShowMonthYearModal(false);
                  setShowCalendar(true);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 rounded-md bg-[#F53033] text-white border-[#F53033] cursor-pointer"
                onClick={() => {
                  setCalendarMonth(tempMonth);
                  setCalendarYear(tempYear);
                  setShowMonthYearModal(false);
                  setShowCalendar(true);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* User Summary */}
      <div className="mb-4">
        <UserSummary
          adminCount={adminCount}
          instructorCount={instructorCount}
          parentCount={parentCount}
          studentCount={studentCount}
        />
      </div>
      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const isAll = tab.value === "all";
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors cursor-pointer
                ${isActive
                  ? "border-b-2 border-red-600"
                  : "border-b-2 border-transparent hover:text-red-600"}
                bg-transparent rounded-t cursor-pointer
              `}
              style={{ outline: "none", background: "none", color: isActive ? "#EB5017" : "#70707A" }}
            >
              {tab.label}
              {isAll && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-white bg-red-600 text-xs font-semibold">
                  {getCount("all")}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Controls: Search, Filter, Export */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white rounded-xl p-4 mb-8" style={{ border: "1px solid #E4E7EC" }}>
        <div className="flex gap-2">
          <div className="flex items-center border rounded px-2 py-1 bg-white">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center border rounded px-2 py-1 bg-white">
            <FaFilter className="text-gray-400 mr-2" />
            <span>Filter</span>
          </div>
        </div>
        <div className="flex gap-3 relative">
          {/* Create New Button */}
          <button
            className="flex items-center gap-2 bg-red-600 border cursor-pointer border-red-600 text-white rounded-md px-4 py-2 font-medium shadow hover:bg-red-700 transition"
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus className="text-white" />
            <span>Create New</span>
          </button>
          {/* Export Button */}
         <button
  className="flex items-center gap-2 bg-white border cursor-pointer border-red-600 text-red-600 rounded-md px-4 py-2 font-medium shadow hover:bg-red-50 transition"
  onClick={() => setShowExportModal((prev) => !prev)}
>
  <FaDownload className="text-red-600" />
  Export
</button>
{showExportModal && (
  <>
    {/* Overlay to close modal when clicking outside */}
    <div
      className="fixed inset-0 z-40"
      style={{ background: "transparent" }}
      onClick={() => setShowExportModal(false)}
    />
    <ExportModal
      onClose={() => setShowExportModal(false)}
      // filters={yourFiltersObject} 
      includeAll={true}
    />
  </>
)}
        </div>
      </div>
      {/* Table/Grid or Empty State */}
      <div className="bg-white rounded-xl p-0" style={{ border: "1px solid #E4E7EC" }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex bg-white mt-4 flex-col items-center justify-center py-20 rounded-xl " style={{ border: '1px solid #E4E7EC' }}>
            <img
              src="https://res.cloudinary.com/cloud-two-tech/image/upload/v1750963970/Illustration_found_gfbbgd.png"
              alt="No data"
              className="w-[225px] h-[188px] mb-4"
            />
            <h2 className="text-2xl font-semibold text-[#303030]">Nothing here yet...</h2>
            <p className="text-base text-[#9E9E9E] mt-3">Whoops ... there’s no information available yet</p>
          </div>
        ) : (
          <>
           <UsersTable
  user={pagedUsers}
  onUserClick={handleUserClick}
/>
            <Pagination
              totalRows={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              currentPage={page}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
      {/* Create Profile Modal */}
      {showCreateModal && (
        <CreateProfileModal
          onClose={() => {
            setShowCreateModal(false);
            // Optionally refetch users
          }}
        />
      )}
    </div>
  );
}